/*
 * Modelo Monte Carlo del sprint de AgendaFácil, traducido de backend/app/simulacion.py (mismas reglas):
 * - duración real de cada tarea = horas estimadas × LogNormal(0, σ) (la estimación es la mediana; los retrasos
 *   son más largos que los adelantos);
 * - cada persona hace sus tareas una tras otra, en el orden del plan (día de inicio, número), respetando las
 *   dependencias de scripts/plan_sprint.py;
 * - la validación (tarea 15) ocurre dentro de la sprint review: no consume horas;
 * - cada día ofrece `capacidad` horas, 2 h menos el lunes (planning) y el viernes (review y retro);
 * - histograma en medios días: Lun AM … Vie PM y «Después del viernes».
 * Sin dependencias: script clásico que expone window.GaltonModelo (y globalThis en Node, para el build).
 */
(function (global) {
  "use strict";

  const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
  const ETIQUETAS = DIAS.flatMap((d) => [d + " AM", d + " PM"]).concat(["Después del viernes"]);
  const CORTAS = DIAS.flatMap((d) => [d + " AM", d + " PM"]).concat(["Después"]);
  const HORAS_EVENTOS = { 1: 2, 5: 2 };

  // DISENO.md §4 + scripts/plan_sprint.py (CALENDARIO_TAREAS y DEPENDENCIAS)
  const TAREAS = [
    { id: 1, persona: "Adonai", horas: 1, dia: 1, tipo: "analisis", deps: [], texto: "Criterios de aceptación del registro" },
    { id: 2, persona: "Mauricio", horas: 2, dia: 1, tipo: "backend", deps: [1], texto: "Tabla de pacientes" },
    { id: 3, persona: "Mauricio", horas: 4, dia: 1, tipo: "backend", deps: [1, 2], texto: "API de registro" },
    { id: 4, persona: "Diego", horas: 4, dia: 1, tipo: "frontend", deps: [1], texto: "Pantalla de registro" },
    { id: 5, persona: "Cesar", horas: 2, dia: 2, tipo: "pruebas", deps: [3, 4], texto: "Probar el registro" },
    { id: 6, persona: "Mauricio", horas: 3, dia: 2, tipo: "backend", deps: [], texto: "Horarios por dentista" },
    { id: 7, persona: "Mauricio", horas: 5, dia: 3, tipo: "backend", deps: [6], texto: "API de disponibilidad" },
    { id: 8, persona: "Diego", horas: 6, dia: 2, tipo: "frontend", deps: [], texto: "Calendario de disponibilidad" },
    { id: 9, persona: "Adonai", horas: 2, dia: 2, tipo: "analisis", deps: [6], texto: "Horarios de prueba de la clínica" },
    { id: 10, persona: "Cesar", horas: 2, dia: 4, tipo: "pruebas", deps: [7, 8, 9], texto: "Probar la disponibilidad" },
    { id: 11, persona: "Mauricio", horas: 6, dia: 4, tipo: "backend", deps: [3, 7], texto: "API de reserva" },
    { id: 12, persona: "Mauricio", horas: 3, dia: 5, tipo: "backend", deps: [11], texto: "Correo de confirmación" },
    { id: 13, persona: "Diego", horas: 6, dia: 3, tipo: "frontend", deps: [8], texto: "Flujo de reserva" },
    { id: 14, persona: "Cesar", horas: 4, dia: 5, tipo: "pruebas", deps: [5, 10, 11, 13], texto: "Prueba de punta a punta" },
    { id: 15, persona: "Adonai", horas: 1, dia: 5, tipo: "validacion", deps: [12, 14], texto: "Validar en la review" },
  ];
  const enReview = (t) => t.tipo === "validacion";

  // Orden del plan (día, id) respetando dependencias: igual que _orden_topologico
  const ORDEN = (function () {
    const pendientes = TAREAS.slice().sort((a, b) => a.dia - b.dia || a.id - b.id);
    const hechas = new Set();
    const orden = [];
    while (pendientes.length) {
      const i = pendientes.findIndex((t) => t.deps.every((d) => hechas.has(d)));
      if (i < 0) throw new Error("Las dependencias del sprint forman un ciclo");
      const [t] = pendientes.splice(i, 1);
      orden.push(t);
      hechas.add(t.id);
    }
    return orden;
  })();
  // Cada fila de clavos = una tarea que consume horas (14), en el orden en que se programan
  const FILAS = ORDEN.filter((t) => !enReview(t));

  function limitesDias(capacidad) {
    let acumulado = 0;
    const limites = [0];
    for (let d = 1; d <= 5; d++) {
      acumulado += Math.max(capacidad - (HORAS_EVENTOS[d] || 0), 0.5);
      limites.push(acumulado);
    }
    return limites;
  }

  function diaDe(t, limites, capacidad) {
    for (let d = 1; d < limites.length; d++) {
      if (t <= limites[d] + 1e-9) return d - 1 + (t - limites[d - 1]) / (limites[d] - limites[d - 1]);
    }
    return 5 + (t - limites[limites.length - 1]) / capacidad;
  }

  const cubetaDe = (dia) => Math.min(Math.floor(dia * 2), 10);

  // Término (horas de trabajo) con estas duraciones: igual que programar() + max(fin)
  function termino(dur) {
    const libre = {};
    const fin = {};
    let maximo = 0;
    for (const t of ORDEN) {
      const previo = t.deps.reduce((m, d) => Math.max(m, fin[d]), 0);
      if (enReview(t)) fin[t.id] = previo;
      else {
        fin[t.id] = Math.max(libre[t.persona] || 0, previo) + dur[t.id];
        libre[t.persona] = fin[t.id];
      }
      if (fin[t.id] > maximo) maximo = fin[t.id];
    }
    return maximo;
  }

  // Generador con semilla (mulberry32) y normal estándar (Box-Muller)
  function rng(semilla) {
    let a = semilla >>> 0;
    const u = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let guardado = null;
    const normal = () => {
      if (guardado !== null) { const z = guardado; guardado = null; return z; }
      let r = 0, v = 0;
      while (r === 0) r = u();
      v = u();
      const m = Math.sqrt(-2 * Math.log(r));
      guardado = m * Math.sin(2 * Math.PI * v);
      return m * Math.cos(2 * Math.PI * v);
    };
    return { u, normal };
  }

  function plan(capacidad) {
    const limites = limitesDias(capacidad);
    const dur = {};
    for (const t of TAREAS) dur[t.id] = t.horas;
    const dia = diaDe(termino(dur), limites, capacidad);
    return { dia, cubeta: cubetaDe(dia), plazo: limites[5] };
  }

  /*
   * Un sprint simulado. Además del término devuelve el recorrido de la bola: `dias[k]` es el día de término
   * si las primeras k filas (tareas) ya revelaron su duración real y el resto sigue en su estimación.
   * dias[0] es el plan; dias[14] es el término simulado.
   */
  function sprint(g, { variabilidad = 0.25, capacidad = 6 } = {}) {
    const limites = limitesDias(capacidad);
    const real = {};
    for (const t of TAREAS) real[t.id] = t.horas * Math.exp(variabilidad * g.normal());
    const dur = {};
    for (const t of TAREAS) dur[t.id] = t.horas;
    const dias = [diaDe(termino(dur), limites, capacidad)];
    for (const t of FILAS) {
      dur[t.id] = real[t.id];
      dias.push(diaDe(termino(dur), limites, capacidad));
    }
    dur[15] = real[15];
    const horas = termino(dur);
    const dia = diaDe(horas, limites, capacidad);
    return { dias, dia, horas, cubeta: cubetaDe(dia), aTiempo: horas <= limites[5] + 1e-9 };
  }

  function histograma(n, opciones = {}, semilla = 7) {
    const g = rng(semilla);
    const cubetas = new Array(11).fill(0);
    let aTiempo = 0;
    for (let i = 0; i < n; i++) {
      const s = sprint(g, opciones);
      cubetas[s.cubeta] += 1;
      if (s.aTiempo) aTiempo += 1;
    }
    return {
      histograma: ETIQUETAS.map((etiqueta, i) => ({ etiqueta, n: cubetas[i], proporcion: cubetas[i] / n })),
      prob_a_tiempo: aTiempo / n,
    };
  }

  global.GaltonModelo = { DIAS, ETIQUETAS, CORTAS, TAREAS, FILAS, limitesDias, diaDe, cubetaDe, termino, rng, plan, sprint, histograma };
})(typeof window !== "undefined" ? window : globalThis);
