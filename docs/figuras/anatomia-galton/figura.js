/*
 * Figura viva: tablero de Galton de la simulación Monte Carlo del sprint (AgendaFácil).
 * Sin módulos ni scripts en línea (CSP script-src 'self'). Usa window.IsoKit (iso-kit.js) y
 * window.GaltonModelo (modelo.js, la misma lógica que backend/app/simulacion.py).
 *
 * Cada bola es un sprint simulado. Cae desde la tolva (sobre el término del plan) y atraviesa 14 filas de clavos;
 * la fila k es la tarea k (en el orden en que se programa). Por omisión la figura corre su propio Monte Carlo:
 * en cada fila la bola se desvía hacia el término que resulta si las primeras k tareas ya revelaron su duración
 * real (estimación × LogNormal(0, σ)) y el resto sigue en su estimación; cae en la cubeta de su término real.
 *
 * ── Contrato postMessage (página padre → esta figura) ─────────────────────────────────────────────────────────
 * Solo se aceptan mensajes del mismo origen (e.origin === location.origin). Carga útil:
 *   {
 *     tipo: "simulacion",
 *     histograma: [{ etiqueta: "Lun AM", proporcion: 0 }, … 11 entradas, la última «Después del viernes»],
 *     prob_a_tiempo: 0.5058,                       // 0…1 (opcional; se muestra como referencia)
 *     parametros: { variabilidad: 0.25, capacidad_horas_dia: 6, iteraciones: 2000 }   // opcional
 *   }
 * Es el mismo formato que devuelve la API (/api/simulaciones → resultado de simular()); sobran campos extra.
 * Al recibirlo la figura se reinicia, mueve la tolva al término del plan con esa capacidad y suelta 200 bolas
 * cuyas cubetas siguen las proporciones recibidas (cuota por déficit), así que las pilas convergen a ese
 * histograma. El recorrido de cada bola se toma del modelo local con esos parámetros, condicionado a caer en
 * su cubeta. Las proporciones se normalizan; un mensaje mal formado se ignora.
 * Ejemplo desde el padre:  iframe.contentWindow.postMessage(resultado, location.origin)
 * Al cargar, si está dentro de un iframe, la figura avisa al padre con { tipo: "galton-listo" } (mismo origen).
 * Parámetros de URL: ?quieto (piles finales sin animación), ?n=… (cuántas bolas sueltan al inicio, por omisión 100).
 * ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";
  const K = window.IsoKit;
  const M = window.GaltonModelo;
  const stage = document.querySelector(".gl-stage");
  if (!K || !M || !stage) return;

  const GEO = JSON.parse(stage.getAttribute("data-geo"));
  const P = GEO.P;
  const svg = stage.querySelector("svg");
  const NS = "http://www.w3.org/2000/svg";
  const layer = svg.querySelector('[data-capa="bolas"]');
  const piles = Array.from({ length: GEO.nb }, (_, i) => svg.querySelector(`[data-pila="${i}"]`));
  const hopper = svg.querySelector('[data-part="tolva"]');
  const chute = svg.querySelector('[data-part="canal"]');
  const out = {
    n: document.querySelector('[data-lectura="n"]'),
    ok: document.querySelector('[data-lectura="a-tiempo"]'),
    med: document.querySelector('[data-lectura="mediana"]'),
    src: document.querySelector('[data-lectura="fuente"]'),
  };
  const buttons = Array.from(document.querySelectorAll(".gl-buttons [data-accion]"));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(location.search);
  const quiet = () => still.matches || params.has("quieto");

  // ---------- geometría ----------
  const R = GEO.ballR;
  const C = GEO.pegR + R; // centro de la bola sobre un clavo
  const ROWS = GEO.rows.length;
  const binC = (i) => GEO.xl + GEO.bw * (i + 0.5);
  const rPx = R * P.scale * Math.sqrt(1.6);
  const ROW_GAP = 4.16;
  const ROWS_FIT = Math.floor((GEO.hb - 2 * R) / ROW_GAP) + 1;
  const SLOTS = (function () {
    const list = [];
    for (let r = 0; r < ROWS_FIT; r++) {
      // filas alternas de perRow y perRow − 1 bolas (empaque hexagonal), del centro hacia los lados
      const n = r % 2 === 0 ? GEO.perRow : GEO.perRow - 1;
      const xs = Array.from({ length: n }, (_, j) => (j - (n - 1) / 2) * 2 * R).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
      for (const dx of xs) list.push([dx, GEO.zFloor + R + r * ROW_GAP]);
    }
    return list;
  })();
  const CAP = SLOTS.length;
  const xOfDay = (d) => (d < 5 ? GEO.xl + d * 2 * GEO.bw : GEO.gateX + GEO.bw * 0.96 * (1 - Math.exp(-(d - 5) / 0.6)));
  const screen = (x, z) => K.iso([x, GEO.ballY, z], P);

  // ---------- estado ----------
  const g = M.rng(params.has("semilla") ? Number(params.get("semilla")) || 7 : (Date.now() ^ 0x5eed) >>> 0);
  let mode = { servidor: false, variabilidad: 0.25, capacidad: 6, prob: null, iteraciones: null, p: null };
  let counts = new Array(GEO.nb).fill(0);
  let reserved = new Array(GEO.nb).fill(0);
  let drawn = new Array(GEO.nb).fill(0);
  let factor = 1;
  let flying = [];
  let queue = 0;
  let spawnEvery = 0.08;
  let spawnClock = 0;
  let hopX = GEO.hopX;
  let hopShown = GEO.hopX;
  let frame = 0, last = 0, visible = false, started = false;

  // ---------- bolas (SVG) ----------
  function ballNode(late) {
    const node = document.createElementNS(NS, "g");
    const body = document.createElementNS(NS, "circle");
    body.setAttribute("class", "gl-bola");
    body.setAttribute("r", rPx.toFixed(2));
    const shine = document.createElementNS(NS, "circle");
    shine.setAttribute("class", "gl-brillo");
    shine.setAttribute("r", (rPx * 0.36).toFixed(2));
    shine.setAttribute("cx", (-rPx * 0.34).toFixed(2));
    shine.setAttribute("cy", (-rPx * 0.38).toFixed(2));
    if (late) { body.setAttribute("data-tarde", ""); shine.setAttribute("data-tarde", ""); }
    node.append(body, shine);
    return node;
  }
  const place = (node, x, z) => { const [sx, sy] = screen(x, z); node.setAttribute("transform", `translate(${sx.toFixed(2)} ${sy.toFixed(2)})`); };

  function drawPile(i) {
    const want = Math.min(CAP, Math.round(counts[i] * factor));
    const pile = piles[i];
    while (drawn[i] > want) { pile.lastChild && pile.removeChild(pile.lastChild); drawn[i]--; }
    while (drawn[i] < want) {
      const [dx, z] = SLOTS[drawn[i]];
      const node = ballNode(false);
      place(node, binC(i) + dx, z);
      pile.appendChild(node);
      drawn[i]++;
    }
  }
  function refreshPiles() {
    const max = Math.max(...counts.map((c, i) => c + reserved[i]));
    const f = max > CAP ? CAP / max : 1;
    if (Math.abs(f - factor) > 1e-9) {
      factor = f;
      piles.forEach((pile, i) => { pile.textContent = ""; drawn[i] = 0; drawPile(i); });
    } else piles.forEach((_, i) => drawPile(i));
  }

  // ---------- lectura ----------
  const pct = (v) => `${Math.round(v * 100)} %`;
  const num = (v, d = 2) => String(Number(v.toFixed(d))).replace(".", ",");
  function readout() {
    const n = counts.reduce((a, b) => a + b, 0);
    const early = counts.slice(0, 10).reduce((a, b) => a + b, 0);
    out.n.textContent = `${n} ${n === 1 ? "sprint" : "sprints"}` + (factor < 1 ? ` · 1 bola ≈ ${num(1 / factor, 1)} sprints` : "");
    if (n === 0) {
      out.ok.innerHTML = "<b>—</b> antes de la review";
      out.med.textContent = "mediana —";
      out.ok.removeAttribute("data-bajo");
    } else {
      out.ok.innerHTML = `<b>${pct(early / n)}</b> antes de la review`;
      out.ok.toggleAttribute("data-bajo", early / n < 0.5);
      let acc = 0, med = 0;
      for (let i = 0; i < counts.length; i++) { acc += counts[i]; if (acc >= n / 2) { med = i; break; } }
      out.med.textContent = `mediana ${M.ETIQUETAS[med]}`;
    }
    if (mode.servidor) {
      out.src.setAttribute("data-servidor", "");
      const bits = ["Resultado del servidor"];
      if (mode.iteraciones) bits.push(`${mode.iteraciones} iteraciones`);
      bits.push(`σ ${num(mode.variabilidad)}`, `${num(mode.capacidad, 1)} h/día`);
      if (mode.prob !== null) bits.push(`servidor: ${pct(mode.prob)} a tiempo`);
      out.src.textContent = bits.join(" · ");
    } else {
      out.src.removeAttribute("data-servidor");
      out.src.textContent = `Modelo local en el navegador · σ ${num(mode.variabilidad)} · ${num(mode.capacidad, 1)} h/día`;
    }
  }

  // ---------- un sprint: cubeta y recorrido ----------
  function pickBin() {
    if (!mode.servidor) {
      const s = M.sprint(g, mode);
      return { bin: s.cubeta, dias: s.dias };
    }
    // cuota por déficit: la cubeta más atrasada respecto de su proporción
    const n = counts.reduce((a, b) => a + b, 0) + reserved.reduce((a, b) => a + b, 0) + flying.filter((b) => !b.slot).length + 1;
    let best = 0, gap = -Infinity;
    mode.p.forEach((p, i) => {
      if (p <= 0) return;
      const have = counts[i] + reserved[i] + flying.filter((b) => b.bin === i && !b.slot).length;
      const d = p * n - have + g.u() * 0.35;
      if (d > gap) { gap = d; best = i; }
    });
    // recorrido: un sprint del modelo local con esos parámetros que caiga en la misma cubeta
    for (let t = 0; t < 400; t++) {
      const s = M.sprint(g, mode);
      if (s.cubeta === best) return { bin: best, dias: s.dias };
    }
    return { bin: best, dias: null };
  }

  function walk(bin, dias) {
    const U = Math.round((binC(bin) - hopX) / GEO.half);
    const lo = Math.round((GEO.xl + 6 - hopX) / GEO.half);
    const hi = Math.round((-GEO.xl - 6 - hopX) / GEO.half);
    let u = 0;
    const us = [0];
    for (let k = 1; k <= ROWS; k++) {
      const rem = ROWS - k;
      const want = dias ? (xOfDay(dias[k]) - hopX) / GEO.half : (U * k) / ROWS + (g.u() - 0.5) * 3;
      const pref = Math.abs(want - u) < 0.6 ? (g.u() < 0.5 ? -1 : 1) : Math.sign(want - u);
      const ok = (s, reach) => { const v = u + s; return v >= lo && v <= hi && Math.abs(U - v) <= reach * rem; };
      let step = [pref, -pref].find((s) => ok(s, 1));
      if (step === undefined) step = [pref, -pref, 3 * pref, -3 * pref].find((s) => ok(s, 3));
      if (step === undefined) step = Math.sign(U - u) * (Math.abs(U - u) >= 3 ? 3 : 1);
      u += step;
      us.push(u);
    }
    return us.map((v) => hopX + v * GEO.half);
  }

  function launch() {
    const { bin, dias } = pickBin();
    const xs = walk(bin, dias);
    const segs = [];
    const z0 = GEO.rows[0] + C;
    segs.push({ ax: hopX, az: GEO.hopZ, bx: hopX, bz: z0, dur: 0.3, kind: "caida" });
    for (let k = 1; k <= ROWS; k++) {
      const az = GEO.rows[k - 1] + C;
      const bz = (k < ROWS ? GEO.rows[k] : GEO.rows[ROWS - 1] - (GEO.rows[0] - GEO.rows[1])) + C;
      const far = Math.abs(xs[k] - xs[k - 1]) > GEO.half * 1.5;
      segs.push({ ax: xs[k - 1], az, bx: xs[k], bz, dur: far ? 0.2 : 0.12, kind: "rebote", hop: far ? 2.6 : 1.1 });
    }
    const node = ballNode(false);
    layer.appendChild(node);
    const ball = { bin, segs, i: 0, t: 0, node, slot: null, late: false };
    place(node, hopX, GEO.hopZ);
    flying.push(ball);
  }

  function finalSeg(ball) {
    const i = ball.bin;
    reserved[i]++;
    refreshPiles();
    const idx = Math.max(0, Math.min(CAP - 1, Math.round((counts[i] + reserved[i]) * factor) - 1));
    const [dx, z] = SLOTS[idx];
    const last = ball.segs[ball.segs.length - 1];
    const dz = last.bz - z;
    ball.slot = true;
    ball.segs.push({ ax: last.bx, az: last.bz, bx: binC(i) + dx, bz: z, dur: 0.12 + Math.sqrt(Math.max(dz, 1)) * 0.045, kind: "caida" });
  }

  function land(ball) {
    reserved[ball.bin]--;
    counts[ball.bin]++;
    ball.node.remove();
    refreshPiles();
    readout();
  }

  function instant(n) {
    for (let j = 0; j < n; j++) counts[pickBin().bin]++;
    refreshPiles();
    readout();
  }

  // ---------- movimiento ----------
  function stepBall(ball, dt) {
    ball.t += dt;
    let seg = ball.segs[ball.i];
    while (ball.t >= seg.dur) {
      ball.t -= seg.dur;
      ball.i++;
      if (ball.i === ball.segs.length && !ball.slot) finalSeg(ball);
      if (ball.i >= ball.segs.length) { land(ball); return false; }
      seg = ball.segs[ball.i];
    }
    const t = ball.t / seg.dur;
    let x, z;
    if (seg.kind === "caida") { x = seg.ax + (seg.bx - seg.ax) * t; z = seg.az - (seg.az - seg.bz) * t * t; }
    else { x = seg.ax + (seg.bx - seg.ax) * Math.sin((t * Math.PI) / 2); z = seg.az - (seg.az - seg.bz) * t * t + seg.hop * Math.sin(Math.PI * t); }
    if (!ball.late && x > GEO.gateX && z < GEO.zFloor + GEO.hb + 4) {
      ball.late = true;
      ball.node.querySelectorAll("circle").forEach((c) => c.setAttribute("data-tarde", ""));
    }
    place(ball.node, x, z);
    return true;
  }

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    // la tolva sigue a su posición con suavizado exponencial
    if (Math.abs(hopX - hopShown) > 0.01) {
      hopShown += (hopX - hopShown) * (1 - Math.exp(-dt / 0.35));
      if (Math.abs(hopX - hopShown) < 0.02) hopShown = hopX;
      const by = K.translateAlong(P, [hopShown - GEO.hopX, 0, 0]);
      hopper.setAttribute("transform", by);
      chute.setAttribute("transform", by);
    }
    const ready = hopShown === hopX;
    if (queue > 0 && ready) {
      spawnClock += dt;
      while (queue > 0 && spawnClock >= spawnEvery) { spawnClock -= spawnEvery; queue--; launch(); }
    }
    flying = flying.filter((b) => stepBall(b, dt));
    const busy = queue > 0 || flying.length > 0 || hopShown !== hopX;
    frame = visible && busy ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };

  function moveHopper(x) {
    hopX = x;
    if (quiet()) {
      hopShown = x;
      const by = K.translateAlong(P, [x - GEO.hopX, 0, 0]);
      hopper.setAttribute("transform", by);
      chute.setAttribute("transform", by);
    }
  }

  // ---------- acciones ----------
  function drop(n, every) {
    if (quiet()) { instant(n); return; }
    spawnEvery = every;
    if (queue === 0) spawnClock = every;
    queue += n;
    run();
  }
  function reset() {
    queue = 0;
    flying.forEach((b) => b.node.remove());
    flying = [];
    counts = new Array(GEO.nb).fill(0);
    reserved = new Array(GEO.nb).fill(0);
    factor = 1;
    piles.forEach((pile, i) => { pile.textContent = ""; drawn[i] = 0; });
    readout();
  }
  const act = (what) => {
    started = true;
    if (what === "uno") drop(1, 0.08);
    else if (what === "cien") drop(100, 0.07);
    else if (what === "reiniciar") reset();
  };
  buttons.forEach((b) => b.addEventListener("click", () => act(b.getAttribute("data-accion"))));
  stage.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    let what = null;
    if (e.key === " " || e.key === "Enter") what = "uno";
    else if (e.key === "s" || e.key === "S") what = "cien";
    else if (e.key === "r" || e.key === "R") what = "reiniciar";
    if (!what) return;
    e.preventDefault();
    act(what);
  });

  // ---------- resultados reales desde la página padre ----------
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    const d = e.data;
    if (!d || d.tipo !== "simulacion" || !Array.isArray(d.histograma) || d.histograma.length !== GEO.nb) return;
    const raw = d.histograma.map((h) => Number(h && h.proporcion));
    if (raw.some((v) => !Number.isFinite(v) || v < 0)) return;
    const sum = raw.reduce((a, b) => a + b, 0);
    if (!(sum > 0)) return;
    const pr = d.parametros || {};
    const variabilidad = Number.isFinite(Number(pr.variabilidad)) && Number(pr.variabilidad) > 0 ? Number(pr.variabilidad) : 0.25;
    const capacidad = Number.isFinite(Number(pr.capacidad_horas_dia)) && Number(pr.capacidad_horas_dia) > 0 ? Number(pr.capacidad_horas_dia) : 6;
    const prob = Number(d.prob_a_tiempo);
    mode = {
      servidor: true, variabilidad, capacidad,
      prob: Number.isFinite(prob) ? Math.min(1, Math.max(0, prob)) : null,
      iteraciones: Number.isFinite(Number(pr.iteraciones)) ? Math.round(Number(pr.iteraciones)) : null,
      p: raw.map((v) => v / sum),
    };
    started = true;
    reset();
    moveHopper(binC(M.plan(capacidad).cubeta));
    drop(200, 0.035);
    run();
  });

  // ---------- arranque ----------
  const first = Math.max(0, Math.min(2000, params.has("n") ? Number(params.get("n")) || 0 : 100));
  if (quiet()) { started = true; instant(first); }
  readout();
  still.addEventListener && still.addEventListener("change", () => {
    if (!still.matches) return;
    // movimiento reducido: lo que va en vuelo cae de inmediato
    const pending = flying.length + queue;
    flying.forEach((b) => { b.node.remove(); if (b.slot) reserved[b.bin]--; });
    flying = [];
    queue = 0;
    instant(pending);
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible && !started) { started = true; drop(first, 0.09); }
      if (visible) run();
    }, { rootMargin: "60px 0px" }).observe(stage);
  } else { visible = true; if (!started) { started = true; drop(first, 0.09); } }
  if (window.parent !== window) {
    // solo si el padre es del mismo origen (leer su location lanza en otro origen)
    let same = false;
    try { same = window.parent.location.origin === location.origin; } catch (_) { same = false; }
    if (same) window.parent.postMessage({ tipo: "galton-listo" }, location.origin);
  }
})();
