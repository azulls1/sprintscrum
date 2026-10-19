/*
 * Figura viva: mueve la clasificadora del backlog según el instante s (0 mezclado … 3 sprint seleccionado).
 * Todo número visible sale de BacklogModelo.estado(s). Sin módulos ni scripts en línea (CSP script-src 'self').
 */
(function () {
  "use strict";
  const K = window.IsoKit;
  const M = window.BacklogModelo;
  const stage = document.querySelector(".bl-stage");
  if (!K || !M || !window.BacklogTarjetas || !stage) return;
  const T = window.BacklogTarjetas.make(K, M);

  const GEO = JSON.parse(stage.getAttribute("data-geo"));
  const P = GEO.P;
  const svg = stage.querySelector("svg");
  const $ = (sel) => svg.querySelector(sel);
  const $$ = (sel) => Array.from(svg.querySelectorAll(sel));
  const scene = $('[data-part="escena"]');
  const readout = document.querySelector('[data-part="lectura"]');
  const carriles = document.querySelector('[data-part="carriles"]');
  const historia = document.querySelector('[data-part="historia"]');
  const tip = stage.querySelector('[data-part="globo"]');
  const buttons = Array.from(document.querySelectorAll(".sc-stop"));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(location.search);
  const clamp = M.clamp;

  const cards = Object.fromEntries($$('[data-part="tarjeta"]').map((el) => [el.getAttribute("data-hu"), el]));
  const caja = $$('[data-part="caja"]');
  const plataforma = $('[data-part="plataforma"]');
  const compuerta = $('[data-part="compuerta"]');
  const aguja = $('[data-part="aguja"]');
  const leds = $$('[data-part="led"]');
  const cursor = $('[data-part="cursor"]');

  const PASOS = ["Mezclado", "Priorizar", "Estimar", "Seleccionar sprint"];
  const DESCRIBE = [
    "Mezclado: 8 historias revueltas en la tolva, sin prioridad ni estimación",
    "Priorizado: Alta, Media y Baja en tres carriles",
    `Estimado: ${M.TOTAL} puntos en el backlog; HU-08 (13) es demasiado grande para una semana`,
    `Sprint 1: ${M.SPRINT.join(", ")} con ${M.PUNTOS_SPRINT} de ${M.CAPACIDAD} puntos; quedan ${M.TOTAL - M.PUNTOS_SPRINT} en el backlog`,
  ];

  function needleFor(v) {
    const g = GEO.dial;
    const a = g.from + (clamp(v, 0, g.max) / g.max) * g.span;
    return K.lineOnTop([g.x - Math.sin(a) * 2.6, g.y + Math.cos(a) * 2.6], [g.x + Math.sin(a) * (g.r - 3.6), g.y - Math.cos(a) * (g.r - 3.6)], g.top + 0.2, P);
  }

  // ---------- estado de animación ----------
  const startS = params.has("paso") ? clamp(Math.round(Number(params.get("paso")) || 0), 0, 3) : GEO.start;
  // ?s=1.4 congela un instante intermedio (para revisar la figura cuadro a cuadro)
  const frozen = params.has("s") ? clamp(Number(params.get("s")) || 0, 0, 3) : null;
  let shown = frozen === null ? startS : frozen;
  let target = frozen === null ? startS : frozen;
  let rate = 0.55; // pasos por segundo del movimiento en curso
  const needle = { at: M.carga(startS), v: 0 };
  let touring = !still.matches && !params.has("quieto") && !params.has("paso") && frozen === null;
  let tourIndex = 3;
  let hold = 0;
  let frame = 0, last = 0, visible = false, idleTimer = 0, lastText = "", lastStop = null, hoverId = null;
  const lastPose = {};
  const TOUR = [0, 1, 2, 3];
  const HOLD = 3.2;

  function sortScene() {
    const kids = Array.from(scene.children);
    const keyed = kids.map((el, i) => ({ el, k: Number(el.getAttribute("data-k")), i }));
    keyed.sort((a, b) => a.k - b.k || a.i - b.i);
    if (keyed.some((e, i) => e.el !== kids[i])) keyed.forEach((e) => scene.appendChild(e.el));
  }

  function lectura(st) {
    const sel = `${st.seleccionados}/${M.CAPACIDAD} pts en el sprint`;
    const n = `${st.enSprint.length} ${st.enSprint.length === 1 ? "historia" : "historias"}`;
    let back;
    if (st.estimadas === 0) back = `backlog: ${M.HISTORIAS.length - st.enSprint.length} historias sin estimar`;
    else if (st.estimadas < M.HISTORIAS.length) back = `backlog: ${st.puntosEstimados} pts estimados de ${st.estimadas} historias`;
    else back = `backlog: ${st.backlog} de ${M.TOTAL} pts`;
    return `${st.fase} · ${sel} · ${n} · ${back}`;
  }

  function carrilesText(st) {
    if (st.ordenadas === 0) return `Tolva: ${M.HISTORIAS.length} historias sin orden`;
    return st.carriles
      .map((c) => `${c.prioridad} ${c.n}${c.estimadas === c.n && c.n ? ` · ${c.puntos} pts` : ""}`)
      .join("  |  ") + (st.grandes.length ? `  |  demasiado grande: ${st.grandes.join(", ")}` : "");
  }

  function draw(dt) {
    const st = M.estado(shown);
    const calm = still.matches;

    // tarjetas: se reconstruyen solo si su pose cambió
    st.poses.forEach((p) => {
      const el = cards[p.id];
      const sig = [p.x, p.y, p.z, p.giro, p.alto].map((v) => v.toFixed(2)).join() + p.estimada + p.enSprint;
      if (lastPose[p.id] !== sig) {
        lastPose[p.id] = sig;
        el.innerHTML = T.svg(p, P);
        el.setAttribute("data-k", T.key(p, P).toFixed(3));
      }
      const cls = T.clase(p);
      if (el.getAttribute("class") !== cls) el.setAttribute("class", cls);
      el.toggleAttribute("data-hover", hoverId === p.id);
    });
    sortScene();

    // báscula y caja
    const sink = st.hundido;
    const down = K.translateAlong(P, [0, 0, -sink]);
    caja.forEach((el) => el.setAttribute("transform", down));
    plataforma.setAttribute("transform", down);
    compuerta.setAttribute("transform", K.translateAlong(P, [0, GEO.compuertaRecorrido * st.compuerta, 0]));

    // aguja: resorte críticamente amortiguado hacia la carga
    if (calm || !dt) { needle.at = st.carga; needle.v = 0; }
    else {
      for (let i = 0; i < 4; i++) { needle.v += ((st.carga - needle.at) * 180 - needle.v * 22) * (dt / 4); needle.at += needle.v * (dt / 4); }
      if (Math.abs(st.carga - needle.at) < 0.002 && Math.abs(needle.v) < 0.002) { needle.at = st.carga; needle.v = 0; }
    }
    aguja.setAttribute("d", needleFor(needle.at));
    cursor.setAttribute("transform", K.translateAlong(P, [needle.at * GEO.regla.perPt, 0, 0]));

    // lectores del puente: se encienden cuando pasa una tarjeta de su carril
    leds.forEach((el) => {
      const carril = el.getAttribute("data-carril");
      const on = st.poses.some((p) => M.porId[p.id].prioridad === carril && shown > 0 && shown < 1 && Math.abs(p.x - M.PLANO.puenteX) < 12 && p.z > M.PLANO.carrilZ + 1);
      el.toggleAttribute("data-on", on);
    });

    const text = lectura(st);
    if (text !== lastText) {
      lastText = text;
      readout.textContent = text;
      carriles.textContent = carrilesText(st);
    }
    if (target !== lastStop && Number.isInteger(target)) {
      lastStop = target;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-paso")) === target)));
      stage.setAttribute("aria-valuenow", String(target));
      stage.setAttribute("aria-valuetext", DESCRIBE[target]);
    }
  }

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const calm = still.matches;
    if (touring && shown === target) {
      hold += dt;
      if (hold >= HOLD) { hold = 0; tourIndex = (tourIndex + 1) % TOUR.length; go(TOUR[tourIndex]); }
    }
    if (calm) shown = target;
    else if (shown !== target) {
      const d = target - shown;
      const step = Math.sign(d) * Math.min(Math.abs(d), rate * dt);
      shown += step;
      if (Math.abs(target - shown) < 1e-4) shown = target;
    }
    draw(dt);
    const settled = !touring && shown === target && needle.v === 0;
    frame = visible && !settled ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  function go(to) {
    target = clamp(Math.round(to), 0, 3);
    // un salto largo (p. ej. de vuelta al mezclado) dura lo mismo que un paso, unos 2 s
    rate = 0.5 * Math.max(1, Math.abs(target - shown));
  }
  const steer = (to) => {
    touring = false;
    hold = 0;
    go(to);
    clearTimeout(idleTimer);
    if (!still.matches && !params.has("quieto")) idleTimer = setTimeout(() => { touring = true; tourIndex = TOUR.indexOf(target); hold = 0; run(); }, 9000);
    run();
  };

  // ---------- entrada ----------
  buttons.forEach((b) => b.addEventListener("click", () => steer(Number(b.getAttribute("data-paso")))));
  stage.addEventListener("keydown", (e) => {
    let to = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") to = target + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = target - 1;
    if (e.key === "Home") to = 0;
    if (e.key === "End") to = 3;
    if (to === null) return;
    e.preventDefault();
    steer(to);
  });
  stage.addEventListener("focus", () => { if (touring) { touring = false; clearTimeout(idleTimer); } });

  // globo con el texto de la historia
  function show(id, e) {
    const h = M.porId[id];
    const p = M.pose(h, shown);
    const pts = p.estimada ? `${h.puntos} pts` : "sin estimar";
    const warn = p.estimada && M.grande(h);
    tip.innerHTML = "";
    const b = document.createElement("b");
    b.textContent = `${h.id} · ${h.prioridad} · ${pts}${warn ? " · demasiado grande para una semana" : ""}${p.enSprint ? " · en el Sprint 1" : ""}`;
    tip.appendChild(b);
    tip.appendChild(document.createTextNode(h.texto));
    tip.toggleAttribute("data-warn", warn);
    // el globo se ancla sobre la tarjeta, no sobre el cursor, para no taparla
    const box = stage.getBoundingClientRect();
    const card = cards[id].getBoundingClientRect();
    const half = Math.min(140, box.width / 2 - 4);
    const x = clamp(card.left + card.width / 2 - box.left, half, box.width - half);
    tip.style.left = `${x}px`;
    tip.style.top = `${card.top - box.top}px`;
    tip.hidden = false;
    historia.innerHTML = "";
    const hb = document.createElement("b");
    hb.textContent = `${h.id} (${h.prioridad}, ${pts}): `;
    historia.appendChild(hb);
    historia.appendChild(document.createTextNode(h.texto));
    if (hoverId !== id) { hoverId = id; draw(0); }
  }
  function hide() {
    tip.hidden = true;
    if (hoverId) { hoverId = null; draw(0); }
  }
  const cardAt = (e) => { const el = e.target.closest && e.target.closest('[data-part="tarjeta"]'); return el ? el.getAttribute("data-hu") : null; };
  stage.addEventListener("pointermove", (e) => { const id = cardAt(e); if (id) { touring = false; clearTimeout(idleTimer); show(id, e); } else hide(); });
  stage.addEventListener("pointerdown", (e) => { const id = cardAt(e); if (id) show(id, e); else hide(); });
  stage.addEventListener("pointerleave", () => { hide(); if (!still.matches && !params.has("quieto")) { clearTimeout(idleTimer); idleTimer = setTimeout(() => { touring = true; tourIndex = TOUR.indexOf(target); hold = 0; run(); }, 3600); } });
  still.addEventListener && still.addEventListener("change", () => { if (still.matches) touring = false; run(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
  } else { visible = true; run(); }
  draw(0);
})();
