/*
 * Modelo del sprint de AgendaFácil (fuente: docs/DISENO.md, sección 4).
 * Un único modelo puro: la geometría de la figura (build) y la lectura en vivo (figura.js)
 * salen de aquí. No contiene cadenas de lectura precalculadas: todo se calcula.
 */
(function (global) {
  "use strict";

  const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
  // Capacidad de referencia por persona: 6 h/día, 4 h lunes y viernes por los eventos.
  const CAPACIDAD = [4, 6, 6, 6, 4];

  // Carriles de atrás hacia adelante.
  const PERSONAS = [
    { id: "adonai", nombre: "Adonai", rol: "Product owner" },
    { id: "cesar", nombre: "Cesar", rol: "Scrum master y QA" },
    { id: "mauricio", nombre: "Mauricio", rol: "Backend" },
    { id: "diego", nombre: "Diego", rol: "Frontend" },
  ];

  // Product backlog: 8 historias en orden de prioridad, puntos Fibonacci.
  const HISTORIAS = [
    { id: "HU-01", puntos: 3, enSprint: true },
    { id: "HU-02", puntos: 5, enSprint: true },
    { id: "HU-03", puntos: 8, enSprint: true },
    { id: "HU-04", puntos: 5, enSprint: false },
    { id: "HU-05", puntos: 8, enSprint: false },
    { id: "HU-06", puntos: 5, enSprint: false },
    { id: "HU-07", puntos: 3, enSprint: false },
    { id: "HU-08", puntos: 13, enSprint: false },
  ];

  // Sprint backlog: 15 tareas. dias = [inicio, fin], 1 = lunes … 5 = viernes.
  const TAREAS = [
    { n: 1, hu: "HU-01", persona: "adonai", horas: 1, dias: [1, 1], texto: "Criterios de aceptación y datos del registro" },
    { n: 2, hu: "HU-01", persona: "mauricio", horas: 2, dias: [1, 1], texto: "Tabla de pacientes" },
    { n: 3, hu: "HU-01", persona: "mauricio", horas: 4, dias: [1, 2], texto: "API de registro con validación" },
    { n: 4, hu: "HU-01", persona: "diego", horas: 4, dias: [1, 1], texto: "Pantalla de registro responsive" },
    { n: 5, hu: "HU-01", persona: "cesar", horas: 2, dias: [2, 2], texto: "Probar el registro" },
    { n: 6, hu: "HU-02", persona: "mauricio", horas: 3, dias: [2, 2], texto: "Horarios por dentista y consultorio" },
    { n: 7, hu: "HU-02", persona: "mauricio", horas: 5, dias: [3, 3], texto: "API de disponibilidad" },
    { n: 8, hu: "HU-02", persona: "diego", horas: 6, dias: [2, 3], texto: "Calendario de disponibilidad" },
    { n: 9, hu: "HU-02", persona: "adonai", horas: 2, dias: [2, 2], texto: "Horarios de prueba de la clínica" },
    { n: 10, hu: "HU-02", persona: "cesar", horas: 2, dias: [4, 4], texto: "Probar la disponibilidad" },
    { n: 11, hu: "HU-03", persona: "mauricio", horas: 6, dias: [4, 4], texto: "API de reserva sin doble reserva" },
    { n: 12, hu: "HU-03", persona: "mauricio", horas: 3, dias: [5, 5], texto: "Correo de confirmación" },
    { n: 13, hu: "HU-03", persona: "diego", horas: 6, dias: [3, 4], texto: "Flujo de reserva y confirmación" },
    { n: 14, hu: "HU-03", persona: "cesar", horas: 4, dias: [5, 5], texto: "Prueba de punta a punta" },
    { n: 15, hu: "HU-03", persona: "adonai", horas: 1, dias: [5, 5], texto: "Validar el incremento en la review" },
  ];

  // Plano de la máquina en unidades de mundo (x a lo largo de la línea, y de atrás hacia adelante, z arriba).
  const PLANO = {
    x0: -150, // inicio del lunes sobre la banda
    ancho: 68, // un día de banda
    pad: 1, // margen al inicio de cada celda de día
    carril: 16, // ancho de un carril (y)
    carrilY: [-24, -8, 8, 24], // centro de cada carril, de atrás hacia adelante
    banda: 6, // altura de la cara superior de la banda
    bloque: 6, // altura de un bloque de tarea
    puntoAlto: 3, // altura de tarjeta por punto de historia
  };

  const historiasSprint = HISTORIAS.filter((h) => h.enSprint);
  const PUNTOS_SPRINT = historiasSprint.reduce((s, h) => s + h.puntos, 0);
  const HORAS_SPRINT = TAREAS.reduce((s, t) => s + t.horas, 0);

  const xDia = (j) => PLANO.x0 + j * PLANO.ancho; // borde izquierdo del día j (0 = lunes)

  // Cada tarea reparte sus horas por igual entre sus días; dentro de un día, cada persona
  // avanza sus tareas en orden, con una longitud proporcional a horas / capacidad del día.
  // Si la tarea sigue al día siguiente, su pieza llega al final de la celda (bloque continuo).
  function piezas() {
    const lista = [];
    for (let j = 0; j < 5; j++) {
      const dia = j + 1;
      PERSONAS.forEach((p, carril) => {
        const activas = TAREAS.filter((t) => t.persona === p.id && t.dias[0] <= dia && t.dias[1] >= dia);
        // primero la que viene del día anterior, luego por número de tarea
        activas.sort((a, b) => (b.dias[0] < dia) - (a.dias[0] < dia) || a.n - b.n);
        let x = xDia(j) + PLANO.pad;
        activas.forEach((t, i) => {
          const span = t.dias[1] - t.dias[0] + 1;
          const horas = t.horas / span;
          const viene = t.dias[0] < dia;
          const sigue = t.dias[1] > dia;
          const xs = viene ? xDia(j) : x;
          let xe = xs + (horas / CAPACIDAD[j]) * (PLANO.ancho - 2 * PLANO.pad);
          if (sigue && i === activas.length - 1) xe = xDia(j + 1);
          lista.push({ tarea: t.n, hu: t.hu, persona: p.id, carril, dia, horas, xs, xe });
          x = xe;
        });
      });
    }
    return lista;
  }
  const PIEZAS = piezas();

  // Un bloque por tarea: la unión de sus piezas (son contiguas por construcción).
  const BLOQUES = TAREAS.map((t) => {
    const ps = PIEZAS.filter((p) => p.tarea === t.n);
    return {
      tarea: t.n,
      hu: t.hu,
      persona: t.persona,
      carril: ps[0].carril,
      xs: Math.min(...ps.map((p) => p.xs)),
      xe: Math.max(...ps.map((p) => p.xe)),
    };
  });

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // d: -1 = product backlog, 0 = sprint planning (lun 9:00), 1…5 = fin de cada día, 6 = review y retro.
  const PARADAS = [
    { d: -1, nombre: "Backlog" },
    { d: 0, nombre: "Planeación" },
    { d: 1, nombre: "Lun" },
    { d: 2, nombre: "Mar" },
    { d: 3, nombre: "Mié" },
    { d: 4, nombre: "Jue" },
    { d: 5, nombre: "Vie" },
    { d: 6, nombre: "Review" },
  ];

  const xDe = (d) => PLANO.x0 + clamp(d, 0, 5) * PLANO.ancho; // posición del pórtico
  const hechoDe = (p, x) => clamp((x - p.xs) / (p.xe - p.xs), 0, 1);

  function estado(d) {
    const x = xDe(d);
    const horasHechas = PIEZAS.reduce((s, p) => s + p.horas * hechoDe(p, x), 0);
    const tareasHechas = BLOQUES.filter((b) => x >= b.xe - 1e-6).length;
    const huHechas = historiasSprint.filter((h) => BLOQUES.filter((b) => b.hu === h.id).every((b) => x >= b.xe - 1e-6));
    const porPersona = PERSONAS.map((p) => {
      const mias = PIEZAS.filter((q) => q.persona === p.id);
      const total = mias.reduce((s, q) => s + q.horas, 0);
      const hechas = mias.reduce((s, q) => s + q.horas * hechoDe(q, x), 0);
      const trabajando = d > 0 && d < 5 && mias.some((q) => x > q.xs + 0.2 && x < q.xe - 0.2);
      return { id: p.id, nombre: p.nombre, total, hechas, trabajando };
    });
    return {
      d,
      x,
      restantes: Math.max(0, HORAS_SPRINT - horasHechas),
      tareasHechas,
      puntos: huHechas.reduce((s, h) => s + h.puntos, 0),
      huHechas: huHechas.map((h) => h.id),
      porPersona,
      seleccion: clamp(d + 1, 0, 1), // tarjetas cruzando la compuerta de planeación
      retro: clamp(d - 5, 0, 1), // review y retrospectiva
      diasCerrados: clamp(Math.floor(d + 1e-6), 0, 5),
    };
  }

  // Burndown planeado al cierre de cada día, calculado (no tecleado).
  const BURNDOWN = [0, 1, 2, 3, 4, 5].map((d) => Math.round(estado(d).restantes * 100) / 100);

  // Momento (en d) en que termina cada historia del sprint.
  const TERMINA = Object.fromEntries(
    historiasSprint.map((h) => {
      const xe = Math.max(...BLOQUES.filter((b) => b.hu === h.id).map((b) => b.xe));
      return [h.id, (xe - PLANO.x0) / PLANO.ancho];
    }),
  );

  global.SprintModelo = {
    DIAS, CAPACIDAD, PERSONAS, HISTORIAS, TAREAS, PLANO, PIEZAS, BLOQUES, PARADAS, BURNDOWN, TERMINA,
    PUNTOS_SPRINT, HORAS_SPRINT, PUNTOS_BACKLOG: HISTORIAS.reduce((s, h) => s + h.puntos, 0),
    estado, xDe, clamp,
  };
})(typeof window !== "undefined" ? window : globalThis);
