/*
 * Modelo de la priorización del product backlog de AgendaFácil (fuente: fuente/contenido.py, sección 3,
 * y docs/DISENO.md, sección 4). Un único modelo puro: la geometría de la figura (build), la pose de cada
 * tarjeta en cada instante y la lectura en vivo (figura.js) salen de aquí. Nada de cifras tecleadas en la
 * lectura: todo se calcula.
 */
(function (global) {
  "use strict";

  // Capacidad de referencia de un sprint de una semana para el equipo de 4 (velocidad estimada).
  const CAPACIDAD = 16;
  const PRIORIDADES = ["Alta", "Media", "Baja"];

  // Product backlog: id, historia, prioridad, puntos de historia (serie de Fibonacci).
  const HISTORIAS = [
    { id: "HU-01", prioridad: "Alta", puntos: 3, texto: "Como paciente quiero registrarme con mi nombre, teléfono y correo para poder agendar citas." },
    { id: "HU-02", prioridad: "Alta", puntos: 5, texto: "Como paciente quiero ver los horarios disponibles por dentista y día para elegir el que me convenga." },
    { id: "HU-03", prioridad: "Alta", puntos: 8, texto: "Como paciente quiero reservar una cita en un horario libre y recibir confirmación por correo para tener constancia." },
    { id: "HU-04", prioridad: "Media", puntos: 5, texto: "Como recepcionista quiero ver en un panel la agenda del día de los tres consultorios para organizar la atención." },
    { id: "HU-05", prioridad: "Media", puntos: 8, texto: "Como paciente quiero recibir un recordatorio por WhatsApp 24 horas antes para no olvidar mi cita." },
    { id: "HU-06", prioridad: "Media", puntos: 5, texto: "Como paciente quiero cancelar o reprogramar mi cita desde un enlace para liberar el horario." },
    { id: "HU-07", prioridad: "Baja", puntos: 3, texto: "Como administrador quiero un reporte mensual de inasistencias para medir el avance del objetivo." },
    { id: "HU-08", prioridad: "Baja", puntos: 13, texto: "Como paciente quiero un asistente conversacional que responda dudas frecuentes sobre tratamientos y horarios para resolverlas a cualquier hora sin llamar a la clínica." },
  ];

  // Orden en que llegan a la tolva: sin prioridad ni estimación.
  const MEZCLA = ["HU-05", "HU-01", "HU-08", "HU-03", "HU-07", "HU-02", "HU-06", "HU-04"];
  const GIRO = [-9, 6, -4, 11, 7, -12, 3, -7]; // grados, por posición en la tolva

  const TOTAL = HISTORIAS.reduce((s, h) => s + h.puntos, 0);
  const porId = Object.fromEntries(HISTORIAS.map((h) => [h.id, h]));

  // Orden de prioridad: carril, luego el orden del backlog dentro del carril.
  const ORDEN = HISTORIAS.slice().sort((a, b) => PRIORIDADES.indexOf(a.prioridad) - PRIORIDADES.indexOf(b.prioridad));
  const RANGO = Object.fromEntries(ORDEN.map((h, i) => [h.id, i]));
  const enCarril = (h) => ORDEN.filter((o) => o.prioridad === h.prioridad).indexOf(h);

  // Selección del sprint: en orden de prioridad, mientras la suma quepa en la capacidad.
  function seleccionar() {
    let suma = 0;
    const out = [];
    for (const h of ORDEN) {
      if (suma + h.puntos > CAPACIDAD) break;
      suma += h.puntos;
      out.push(h.id);
    }
    return out;
  }
  const SPRINT = seleccionar();
  const PUNTOS_SPRINT = SPRINT.reduce((s, id) => s + porId[id].puntos, 0);
  // Una historia que ocupa más de la mitad del sprint no cabe con holgura en una semana: hay que dividirla.
  const LIMITE = CAPACIDAD / 2;
  const grande = (h) => h.puntos > LIMITE;

  // Plano en unidades de mundo (x a lo largo de la máquina, y de atrás hacia adelante, z arriba).
  const PLANO = {
    K: 2.6, // alto de tarjeta por punto
    blanco: 9, // alto de una tarjeta sin estimar
    ancho: 14, // ancho de tarjeta (x)
    grueso: 3, // grueso de tarjeta (y)
    carrilY: { Alta: 30, Media: -2, Baja: -34 },
    carrilZ: 2, // cara superior de los carriles
    ranuraX: [-64, -44, -24], // centro de cada ranura del carril
    tolva: { x: -192, y: -24, w: 68, d: 44, r: 2 },
    tolvaZ: 9, // piso interior de la tolva
    tolvaCol: [-181, -165, -149, -133],
    tolvaFila: [-12, 8],
    puenteX: -92,
    porticoX: 14,
    compuertaX: 22,
    caja: { x: 36, y: 16, w: 58, d: 28, r: 2 },
    cajaZ: 6, // piso interior de la caja (sobre la plataforma de la báscula)
    cajaX: [46, 64, 82],
    hundePorPunto: 0.11, // la plataforma baja con la carga
    dial: { x: 118, y: 8, r: 13, top: 17, max: 20, from: -0.75 * Math.PI, span: 1.5 * Math.PI },
  };
  PLANO.galibo = PLANO.carrilZ + LIMITE * PLANO.K + 1.2; // la barra del pórtico deja pasar hasta LIMITE puntos

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const window01 = (s, start, dur) => smooth(clamp((s - start) / dur, 0, 1));

  // Ventanas de tiempo de cada fase (s: 0 = mezclado, 1 = priorizado, 2 = estimado, 3 = sprint seleccionado).
  const priorizar = (h, s) => window01(s, 0.04 + RANGO[h.id] * 0.075, 0.36);
  const estimar = (h, s) => window01(s, 1.05 + RANGO[h.id] * 0.08, 0.3);
  const llevar = (h, s) => {
    const j = SPRINT.indexOf(h.id);
    return j < 0 ? 0 : window01(s, 2.12 + j * 0.22, 0.36);
  };

  function poseTolva(h) {
    const m = MEZCLA.indexOf(h.id);
    return { x: PLANO.tolvaCol[m % 4] + (m % 2 ? 0.8 : -0.6), y: PLANO.tolvaFila[m < 4 ? 0 : 1] + (m % 3) - 1, z: PLANO.tolvaZ, giro: (GIRO[m] * Math.PI) / 180 };
  }
  function poseCarril(h) {
    return { x: PLANO.ranuraX[enCarril(h)] + (h.prioridad === "Media" ? 3 : 0), y: PLANO.carrilY[h.prioridad], z: PLANO.carrilZ, giro: 0 };
  }

  // Interpola a lo largo de una polilínea 3D por longitud de arco.
  function along(points, t) {
    const lens = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      lens.push(l);
      total += l;
    }
    let d = t * total;
    for (let i = 1; i < points.length; i++) {
      if (d <= lens[i - 1] || i === points.length - 1) {
        const f = lens[i - 1] ? clamp(d / lens[i - 1], 0, 1) : 1;
        const [a, b] = [points[i - 1], points[i]];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      }
      d -= lens[i - 1];
    }
    return points[points.length - 1];
  }

  // Carga sobre la báscula (puntos ya asentados en la caja) para un instante s.
  function carga(s) {
    return SPRINT.reduce((sum, id) => sum + porId[id].puntos * clamp((llevar(porId[id], s) - 0.86) / 0.14, 0, 1), 0);
  }
  const hundido = (s) => carga(s) * PLANO.hundePorPunto;

  // Pose de una tarjeta en el instante s: centro de la base, giro, alto y estado.
  function pose(h, s) {
    const A = poseTolva(h);
    const B = poseCarril(h);
    const pP = priorizar(h, s);
    const pE = estimar(h, s);
    const pL = llevar(h, s);
    let at;
    let giro = A.giro * (1 - pP);
    if (pL > 0) {
      const j = SPRINT.indexOf(h.id);
      const xc = PLANO.cajaX[j];
      const zc = PLANO.cajaZ - hundido(s);
      at = along([[B.x, B.y, B.z], [PLANO.porticoX - 8, B.y, B.z], [PLANO.porticoX + 12, B.y, B.z], [PLANO.caja.x - 6, B.y, 15], [xc, B.y, 15], [xc, B.y, zc]], pL);
    } else if (pP >= 1) {
      at = [B.x, B.y, B.z];
    } else {
      const lift = 17;
      at = along([[A.x, A.y, A.z], [A.x, A.y, lift], [PLANO.puenteX, (A.y + B.y) / 2, lift], [B.x, B.y, B.z + 9], [B.x, B.y, B.z]], pP);
    }
    const alto = PLANO.blanco + (h.puntos * PLANO.K - PLANO.blanco) * pE;
    return {
      id: h.id,
      x: at[0],
      y: at[1],
      z: at[2],
      giro,
      alto,
      estimada: pE >= 1,
      enSprint: pL >= 1,
      grande: pE >= 1 && grande(h),
    };
  }

  // La compuerta se abre mientras las tarjetas del sprint cruzan el pórtico.
  const compuerta = (s) => smooth(clamp((s - 2.0) / 0.1, 0, 1)) * smooth(clamp((2.94 - s) / 0.08, 0, 1));

  function fase(s) {
    if (s < 0.02) return "Mezclado";
    if (s < 0.98) return "Priorizando";
    if (s < 1.02) return "Priorizado";
    if (s < 1.98) return "Estimando";
    if (s < 2.02) return "Estimado";
    if (s < 2.98) return "Seleccionando";
    return "Sprint 1 listo";
  }

  function estado(s) {
    const poses = HISTORIAS.map((h) => pose(h, s));
    const est = HISTORIAS.filter((h, i) => poses[i].estimada);
    const dentro = HISTORIAS.filter((h, i) => poses[i].enSprint);
    const sel = dentro.reduce((a, h) => a + h.puntos, 0);
    const ordenadas = HISTORIAS.filter((h) => priorizar(h, s) >= 1).length;
    const carriles = PRIORIDADES.map((p) => {
      const hs = HISTORIAS.filter((h) => h.prioridad === p && priorizar(h, s) >= 1);
      const conocidos = hs.filter((h) => estimar(h, s) >= 1);
      return { prioridad: p, n: hs.length, puntos: conocidos.reduce((a, h) => a + h.puntos, 0), estimadas: conocidos.length };
    });
    return {
      s,
      fase: fase(s),
      poses,
      ordenadas,
      estimadas: est.length,
      puntosEstimados: est.reduce((a, h) => a + h.puntos, 0),
      seleccionados: sel,
      enSprint: dentro.map((h) => h.id),
      backlog: TOTAL - sel,
      grandes: HISTORIAS.filter((h, i) => poses[i].grande).map((h) => h.id),
      carriles,
      carga: carga(s),
      hundido: hundido(s),
      compuerta: compuerta(s),
    };
  }

  global.BacklogModelo = {
    CAPACIDAD, PRIORIDADES, HISTORIAS, MEZCLA, TOTAL, ORDEN, SPRINT, PUNTOS_SPRINT, LIMITE, PLANO,
    porId, grande, pose, estado, carga, hundido, compuerta, clamp, smooth,
  };
})(typeof window !== "undefined" ? window : globalThis);
