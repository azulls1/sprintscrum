"""Simulación Monte Carlo del sprint de una semana (función pura: sin base de datos ni Celery).

Modelo:
- La duración real de cada tarea es `horas_estimadas × LogNormal(0, σ)`. Con μ = 0 la estimación es la mediana:
  la mitad de las veces se tarda menos y la otra mitad más, pero los retrasos son más largos que los adelantos
  (asimetría típica de las estimaciones de software).
- Cada persona trabaja sus tareas una tras otra, en el orden del plan (día de inicio, número de tarea).
- Dependencias explícitas del plan (columna depende_de): p. ej. la prueba de punta a punta espera a la API de
  reserva y al flujo de reserva; la validación con la clínica espera al correo y a la prueba de punta a punta.
- La validación ocurre dentro de la sprint review: no consume capacidad de trabajo; el sprint llega «a tiempo» si
  todo lo que ella necesita termina antes de que acabe la jornada del viernes.
- El tiempo se mide en horas de trabajo. Cada día ofrece `capacidad` horas por persona, salvo el lunes (sprint
  planning) y el viernes (review y retrospectiva), que ofrecen 2 h menos. El sprint termina al acabar el viernes.
"""
import math
import random
import statistics
import time

DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"]
HORAS_EVENTOS = {1: 2, 5: 2}  # horas que se van en eventos de Scrum ese día


def limites_dias(capacidad: float) -> list[float]:
    """Horas de trabajo acumuladas al final de cada día: [0, fin lun, fin mar, …, fin vie]."""
    acumulado, limites = 0.0, [0.0]
    for d in range(1, 6):
        acumulado += max(capacidad - HORAS_EVENTOS.get(d, 0), 0.5)
        limites.append(acumulado)
    return limites


def dia_de(t: float, limites: list[float], capacidad: float) -> float:
    """Convierte horas de trabajo en días (1.0 = final del lunes). Pasado el viernes sigue a ritmo `capacidad`."""
    for d in range(1, len(limites)):
        if t <= limites[d] + 1e-9:
            ancho = limites[d] - limites[d - 1]
            return d - 1 + (t - limites[d - 1]) / ancho
    return 5 + (t - limites[-1]) / capacidad


def dependencias(tareas: list[dict]) -> dict[int, set[int]]:
    """Precedencias del plan (columna depende_de): qué tareas deben terminar antes de empezar cada una."""
    ids = {t["id"] for t in tareas}
    return {t["id"]: set(t.get("depende_de") or []) & ids for t in tareas}


def _en_review(t: dict) -> bool:
    """La validación con la clínica ocurre dentro de la sprint review: no consume horas de trabajo del día."""
    return t["tipo"] == "validacion"


def _orden_topologico(tareas: list[dict], deps: dict[int, set[int]]) -> list[dict]:
    """Orden del plan (día, id) respetando dependencias, para programar en una sola pasada."""
    pendientes = sorted(tareas, key=lambda t: (t["dia_inicio"], t["id"]))
    hechas: set[int] = set()
    orden: list[dict] = []
    while pendientes:
        for t in pendientes:
            if deps[t["id"]] <= hechas:
                orden.append(t)
                hechas.add(t["id"])
                pendientes.remove(t)
                break
        else:
            raise ValueError("Las dependencias del sprint forman un ciclo")
    return orden


def programar(tareas: list[dict], duraciones: dict[int, float], deps: dict[int, set[int]]) -> dict[int, tuple[float, float]]:
    """Inicio y fin (horas de trabajo) de cada tarea con las duraciones dadas."""
    libre: dict[int, float] = {}
    fin: dict[int, float] = {}
    tramos: dict[int, tuple[float, float]] = {}
    for t in _orden_topologico(tareas, deps):
        r = t["responsable_id"]
        if _en_review(t):
            inicio = max([0.0] + [fin[d] for d in deps[t["id"]]])
            fin[t["id"]] = inicio
        else:
            inicio = max([libre.get(r, 0.0)] + [fin[d] for d in deps[t["id"]]])
            fin[t["id"]] = inicio + duraciones[t["id"]]
            libre[r] = fin[t["id"]]
        tramos[t["id"]] = (inicio, fin[t["id"]])
    return tramos


def _restante(tramos: dict[int, tuple[float, float]], b: float, en_review: dict[int, float] | None = None) -> float:
    """Horas reales de trabajo que faltan en el instante b (la validación pesa sus horas estimadas hasta hacerse)."""
    total = 0.0
    for i, (inicio, fin) in tramos.items():
        if en_review and i in en_review:
            total += en_review[i] if b < fin or b == 0 else 0.0
        elif b <= inicio:
            total += fin - inicio
        elif b < fin:
            total += fin - b
    return total


def _percentil(valores: list[float], p: float) -> float:
    s = sorted(valores)
    k = (len(s) - 1) * p
    lo, hi = math.floor(k), math.ceil(k)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def simular(tareas: list[dict], historias: list[dict], integrantes: list[dict], *, iteraciones: int = 2000,
            variabilidad: float = 0.25, capacidad: float = 6.0, semilla: int | None = None) -> dict:
    """Corre la simulación y devuelve un resumen listo para la API."""
    t0 = time.perf_counter()
    rng = random.Random(semilla)
    deps = dependencias(tareas)
    limites = limites_dias(capacidad)
    plazo = limites[-1]
    puntos = {h["id"]: h["puntos"] for h in historias if h["en_sprint"]}
    tareas_por_historia = {h: [t["id"] for t in tareas if t["historia_id"] == h] for h in puntos}
    nombres = {i["id"]: i["nombre_corto"] for i in integrantes}
    personas = sorted({t["responsable_id"] for t in tareas})
    # El trabajo propio de cada persona (sin la validación, que depende de los demás)
    propias_de = {p: {t["id"] for t in tareas if t["responsable_id"] == p and not _en_review(t)} for p in personas}
    review = {t["id"]: float(t["horas"]) for t in tareas if _en_review(t)}

    # Plan determinista (duraciones = estimación): sirve de referencia y para validar la capacidad
    tramos_plan = programar(tareas, {t["id"]: float(t["horas"]) for t in tareas}, deps)

    terminos: list[float] = []
    restantes: list[list[float]] = [[] for _ in limites]
    fin_persona: dict[int, list[float]] = {p: [] for p in personas}
    historia_ok: dict[str, int] = {h: 0 for h in puntos}
    puntos_entregados: list[int] = []
    for _ in range(iteraciones):
        dur = {t["id"]: float(t["horas"]) * rng.lognormvariate(0.0, variabilidad) for t in tareas}
        tramos = programar(tareas, dur, deps)
        termino = max(f for _, f in tramos.values())
        terminos.append(termino)
        for k, b in enumerate(limites):
            restantes[k].append(_restante(tramos, b, review))
        for p in personas:
            propias = [f for i, (_, f) in tramos.items() if i in propias_de[p]]
            fin_persona[p].append(max(propias) if propias else 0.0)
        pts = 0
        for h, ids in tareas_por_historia.items():
            if max(tramos[i][1] for i in ids) <= plazo + 1e-9:
                historia_ok[h] += 1
                pts += puntos[h]
        puntos_entregados.append(pts)

    a_tiempo = sum(1 for x in terminos if x <= plazo + 1e-9) / iteraciones
    total_estimado = sum(float(t["horas"]) for t in tareas)

    # Histograma del día de término en medios días (Lun AM … Vie PM, y «después del viernes»)
    cubetas = [0] * 11
    for x in terminos:
        d = dia_de(x, limites, capacidad)
        cubetas[min(int(d * 2), 10)] += 1
    etiquetas = [f"{DIAS[i // 2]} {'AM' if i % 2 == 0 else 'PM'}" for i in range(10)] + ["Después del viernes"]

    carga = []
    for p in personas:
        horas = sum(float(t["horas"]) for t in tareas if t["responsable_id"] == p)
        fines = fin_persona[p]
        carga.append({
            "integrante_id": p, "nombre": nombres.get(p, str(p)), "horas_estimadas": horas,
            "capacidad_sprint": plazo, "ocupacion": round(horas / plazo, 3),
            "termino_p50_dia": round(dia_de(_percentil(fines, 0.5), limites, capacidad), 2),
            "termino_p90_dia": round(dia_de(_percentil(fines, 0.9), limites, capacidad), 2),
            "prob_a_tiempo": round(sum(1 for f in fines if f <= plazo + 1e-9) / iteraciones, 4),
        })
    critica = min(carga, key=lambda c: c["prob_a_tiempo"])

    return {
        "parametros": {"iteraciones": iteraciones, "variabilidad": variabilidad, "capacidad_horas_dia": capacidad,
                       "semilla": semilla},
        "plazo_horas": plazo,
        "total_estimado_horas": total_estimado,
        "prob_a_tiempo": round(a_tiempo, 4),
        "termino": {k: round(dia_de(_percentil(terminos, p), limites, capacidad), 2)
                    for k, p in (("p10", .1), ("p50", .5), ("p90", .9))},
        "termino_plan_dia": round(dia_de(max(f for _, f in tramos_plan.values()), limites, capacidad), 2),
        "histograma": [{"etiqueta": e, "n": n, "proporcion": round(n / iteraciones, 4)} for e, n in zip(etiquetas, cubetas)],
        "burndown": [
            {"dia": "Inicio" if k == 0 else DIAS[k - 1],
             "ideal": round(total_estimado * (1 - k / 5), 2),
             "plan": round(_restante(tramos_plan, b, review), 2),
             "p10": round(_percentil(restantes[k], .1), 2),
             "p50": round(_percentil(restantes[k], .5), 2),
             "p90": round(_percentil(restantes[k], .9), 2)}
            for k, b in enumerate(limites)
        ],
        "historias": [{"id": h, "puntos": puntos[h], "prob_terminada": round(historia_ok[h] / iteraciones, 4)} for h in puntos],
        "puntos": {"comprometidos": sum(puntos.values()),
                   "esperados": round(statistics.fmean(puntos_entregados), 2),
                   "prob_todos": round(sum(1 for p in puntos_entregados if p == sum(puntos.values())) / iteraciones, 4)},
        "carga": carga,
        "persona_critica": critica["nombre"],
        "duracion_ms": round((time.perf_counter() - t0) * 1000),
    }
