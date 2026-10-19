from app import simulacion as s

from datos_sprint import HISTORIAS, INTEGRANTES, TAREAS


def correr(**kw):
    return s.simular(TAREAS, HISTORIAS, INTEGRANTES, iteraciones=kw.pop("iteraciones", 800), semilla=7, **kw)


def test_capacidad_y_limites():
    assert s.limites_dias(6) == [0, 4, 10, 16, 22, 26]
    assert s.dia_de(26, s.limites_dias(6), 6) == 5
    assert s.dia_de(4, s.limites_dias(6), 6) == 1


def test_plan_determinista_cabe_en_el_sprint():
    r = correr(variabilidad=0.0001, iteraciones=50)
    assert r["total_estimado_horas"] == 51
    assert r["termino_plan_dia"] <= 5
    assert r["prob_a_tiempo"] == 1.0
    assert r["burndown"][0]["plan"] == 51 and r["burndown"][-1]["plan"] == 0
    assert r["puntos"]["comprometidos"] == 16


def test_mas_variabilidad_menos_probabilidad():
    baja, alta = correr(variabilidad=0.1), correr(variabilidad=0.5)
    assert alta["prob_a_tiempo"] < baja["prob_a_tiempo"]
    assert alta["termino"]["p90"] >= baja["termino"]["p90"]


def test_reproducible_con_semilla_y_coherente():
    a, b = correr(), correr()
    assert a["prob_a_tiempo"] == b["prob_a_tiempo"]
    assert sum(h["n"] for h in a["histograma"]) == 800
    for punto in a["burndown"]:
        assert punto["p10"] <= punto["p50"] <= punto["p90"]
    # la persona crítica es la de menor probabilidad de terminar su propio trabajo a tiempo
    assert a["persona_critica"] == min(a["carga"], key=lambda c: c["prob_a_tiempo"])["nombre"]
    # quien prueba al final de la cadena absorbe los retrasos de los demás
    assert a["persona_critica"] == "Cesar Martinez"


def test_dependencias_pruebas_despues_del_desarrollo():
    deps = s.dependencias(TAREAS)
    assert deps[5] == {3, 4}             # probar registro espera a su API y su pantalla
    assert deps[15] == {12, 14}          # la validación espera al correo y a la prueba de punta a punta
    tramos = s.programar(TAREAS, {t["id"]: float(t["horas"]) for t in TAREAS}, deps)
    for i, previas in deps.items():
        for d in previas:
            assert tramos[d][1] <= tramos[i][0] + 1e-9
