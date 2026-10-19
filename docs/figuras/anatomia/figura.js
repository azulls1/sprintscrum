/*
 * Figura viva: mueve la máquina del sprint según el momento d (−1 backlog … 6 review y retro).
 * Todo número visible sale de SprintModelo.estado(d). Sin módulos ni scripts en línea (CSP script-src 'self').
 */
(function () {
  "use strict";
  const K = window.IsoKit;
  const M = window.SprintModelo;
  const stage = document.querySelector(".sc-stage");
  if (!K || !M || !stage) return;

  const GEO = JSON.parse(stage.getAttribute("data-geo"));
  const P = GEO.P;
  const svg = stage.querySelector("svg");
  const $ = (sel) => svg.querySelector(sel);
  const $$ = (sel) => Array.from(svg.querySelectorAll(sel));
  const readout = document.querySelector('[data-part="lectura"]');
  const equipo = document.querySelector('[data-part="equipo"]');
  const buttons = Array.from(document.querySelectorAll(".sc-stop"));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(location.search);

  const parts = {
    clip: $('[data-part="recorte"]'),
    legs: $$('[data-part="pierna"]'),
    beam: $('[data-part="viga"]'),
    bell: $('[data-part="timbre"]'),
    heads: $$('[data-part="cabezal"]'),
    sleeves: $$('[data-part="manga"]'),
    needle: $('[data-part="aguja"]'),
    lamps: $$('[data-part="lampara"]'),
    pieces: $$('[data-part="pieza"]'),
    puck: $('[data-part="retro"]'),
    cards: $$('[data-part="tarjeta"]'),
    before: $('[data-slot="antes"]'),
    after: $('[data-slot="despues"]'),
  };

  const clamp = M.clamp;
  const ease = (t) => t * t * (3 - 2 * t);
  const fmt = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));
  const nombreDe = (d) => {
    if (d < -0.5) return "Product backlog";
    if (d < 0.5) return "Sprint planning · lun 9:00";
    const dias = ["lunes", "martes", "miércoles", "jueves", "viernes"];
    if (Math.abs(d - Math.round(d)) < 0.02 && d < 5.5) return "Fin del " + dias[Math.round(d) - 1];
    if (d <= 5) return "En curso: " + dias[clamp(Math.ceil(d) - 1, 0, 4)];
    return "Review y retrospectiva";
  };
  const nombreCorto = (d) => {
    if (d <= -0.5) return "Backlog";
    if (d <= 0) return "Planeación";
    if (d <= 5) return M.DIAS[clamp(Math.ceil(d) - 1, 0, 4)];
    return "Review";
  };

  // convex hull de puntos de pantalla, para el recorte "hecho" (x < pórtico)
  function hull(points) {
    const s = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const p of s) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
    for (let i = s.length - 1; i >= 0; i--) { const p = s[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
    return lower.slice(0, -1).concat(upper.slice(0, -1));
  }
  function clipFor(x) {
    const c = GEO.clip;
    if (x <= c.x + 0.01) return "M0 0Z";
    const pts = [];
    for (const xx of [c.x, x]) for (const yy of [c.y0, c.y1]) for (const zz of [c.z0, c.z1]) pts.push(K.iso([xx, yy, zz], P));
    return "M" + hull(pts).map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
  }
  function needleFor(rest) {
    const g = GEO.dial;
    const a = g.from + (rest / M.HORAS_SPRINT) * g.span;
    return K.lineOnTop([g.x - Math.sin(a) * 1.5, g.y + Math.cos(a) * 1.5], [g.x + Math.sin(a) * (g.r - 3.2), g.y - Math.cos(a) * (g.r - 3.2)], g.top + 0.2, P);
  }

  // ---------- estado de animación ----------
  const startD = params.has("d") ? clamp(Number(params.get("d")) || 0, -1, 6) : 3;
  let shown = startD; // d mostrado (sigue al objetivo con suavizado)
  let target = startD;
  const heads = parts.heads.map(() => ({ at: 0, rate: 0 }));
  let bellAge = 9; // segundos desde el último toque del timbre
  let touring = !still.matches && !params.has("quieto") && !params.has("d");
  let tourClock = 0;
  let frame = 0, last = 0, visible = false, idleTimer = 0, lastText = "", lastStop = null;

  const TOUR = [-1, 0, 1, 2, 3, 4, 5, 6];
  const HOLD = 2.6; // segundos por parada
  const tourAt = (t) => TOUR[Math.floor(t / HOLD) % TOUR.length];

  function draw(dt) {
    const s = M.estado(shown);
    const x = s.x;
    const tr = (el, by) => el && el.setAttribute("transform", K.translateAlong(P, by));

    // pórtico, cabezales y timbre
    parts.legs.forEach((el) => tr(el, [x, 0, 0]));
    tr(parts.beam, [x, 0, 0]);
    parts.sleeves.forEach((el) => tr(el, [x, 0, 0]));
    const calm = still.matches;
    parts.heads.forEach((el, i) => {
      const want = s.porPersona[i].trabajando ? -GEO.press : 0;
      const h = heads[i];
      if (calm || !dt) { h.at = want; h.rate = 0; }
      else {
        for (let n = 0; n < 4; n++) { h.rate += ((want - h.at) * 260 - h.rate * 30) * (dt / 4); h.at += h.rate * (dt / 4); }
        if (Math.abs(want - h.at) < 0.003 && Math.abs(h.rate) < 0.003) { h.at = want; h.rate = 0; }
      }
      tr(el, [x, 0, h.at]);
    });
    const ring = calm ? 0 : Math.max(0, Math.sin(Math.min(1, bellAge / 0.35) * Math.PI)) * (bellAge < 0.35 ? 1 : 0);
    tr(parts.bell, [x, 0, -1.4 * ring]);
    parts.bell && parts.bell.toggleAttribute("data-sonando", ring > 0.05);

    // trabajo hecho: recorte de las copias verdes detrás del pórtico
    parts.clip.setAttribute("d", clipFor(shown <= 0 ? GEO.clip.x : x));

    // planeación: las tarjetas seleccionadas cruzan la compuerta
    const sel = ease(s.seleccion);
    parts.cards.forEach((el) => {
      const c = GEO.cards[el.getAttribute("data-hu")];
      const dx = (c.to - c.from) * sel;
      tr(el, [dx, 0, 3.5 * Math.sin(Math.PI * sel)]);
      const slot = c.from + dx > GEO.gateX ? parts.after : parts.before;
      if (el.parentNode !== slot) slot.appendChild(el);
    });
    for (const slot of [parts.before, parts.after]) {
      const moving = Array.from(slot.querySelectorAll(':scope > [data-part="tarjeta"]'));
      const xOf = (el) => { const c = GEO.cards[el.getAttribute("data-hu")]; return c.from + (c.to - c.from) * sel; };
      moving.sort((a, b) => xOf(a) - xOf(b)).forEach((el) => { if (slot.lastElementChild !== el) slot.appendChild(el); });
    }

    // incremento: cada historia cae en la caja cuando su última tarea termina
    parts.pieces.forEach((el) => {
      const done = ease(clamp((shown - M.TERMINA[el.getAttribute("data-hu")]) / 0.35, 0, 1));
      tr(el, [0, 0, GEO.pieceDrop * (1 - done)]);
      el.setAttribute("opacity", done.toFixed(3));
      el.style.visibility = done > 0.001 ? "visible" : "hidden";
    });

    // retrospectiva: la ficha vuelve del incremento al backlog
    const r = ease(s.retro);
    tr(parts.puck, [(GEO.puck.to - GEO.puck.from) * r, 0, 0]);
    parts.puck.setAttribute("opacity", (shown > 4.6 ? clamp((shown - 4.6) / 0.3, 0, 1) : 0).toFixed(3));

    // estaciones diarias y reloj de horas restantes
    parts.lamps.forEach((el) => el.toggleAttribute("data-encendida", shown >= Number(el.getAttribute("data-dia")) - 0.02));
    parts.needle.setAttribute("d", needleFor(s.restantes));

    // lectura
    const text = `${nombreDe(shown)} · quedan ${fmt(s.restantes)} h de ${M.HORAS_SPRINT} · ${s.tareasHechas}/${M.TAREAS.length} tareas · ${s.puntos}/${M.PUNTOS_SPRINT} pts`;
    if (text !== lastText) {
      lastText = text;
      readout.textContent = text;
      equipo.textContent = s.porPersona.map((p) => `${p.nombre} ${fmt(p.hechas)}/${p.total} h`).join(" · ");
    }
    const stop = nombreCorto(target);
    if (stop !== lastStop) {
      lastStop = stop;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-d")) === target)));
      const t = M.estado(target);
      stage.setAttribute("aria-valuenow", String(target));
      stage.setAttribute("aria-valuetext", `${nombreDe(target)}: quedan ${fmt(t.restantes)} horas, ${t.tareasHechas} de ${M.TAREAS.length} tareas y ${t.puntos} de ${M.PUNTOS_SPRINT} puntos`);
    }
  }

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const calm = still.matches;
    if (touring) { tourClock += dt; target = tourAt(tourClock); }
    const before = shown;
    // velocidad suave: exponencial con tope para que el rebobinado sea calmado
    if (calm) shown = target;
    else {
      const step = (target - shown) * (1 - Math.exp(-dt / 0.42));
      const cap = 2.6 * dt;
      shown += clamp(step, -cap, cap);
      if (Math.abs(target - shown) < 0.0005) shown = target;
    }
    // daily scrum: martes a viernes a las 9:00 (d cruza 1, 2, 3 y 4 hacia adelante)
    for (const daily of [1, 2, 3, 4]) if (before < daily && shown >= daily) bellAge = 0;
    bellAge += dt;
    draw(dt);
    const settled = !touring && shown === target && bellAge > 0.4 && heads.every((h) => h.rate === 0);
    frame = visible && !settled ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  const steer = (d) => {
    touring = false;
    target = clamp(Math.round(d), -1, 6);
    clearTimeout(idleTimer);
    if (!still.matches && !params.has("quieto")) idleTimer = setTimeout(() => { touring = true; tourClock = (TOUR.indexOf(target) + 1) * HOLD - 0.01; run(); }, 9000);
    run();
  };

  // ---------- entrada ----------
  buttons.forEach((b) => b.addEventListener("click", () => steer(Number(b.getAttribute("data-d")))));
  stage.addEventListener("keydown", (e) => {
    let to = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") to = target + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = target - 1;
    if (e.key === "Home") to = -1;
    if (e.key === "End") to = 6;
    if (to === null) return;
    e.preventDefault();
    steer(to);
  });
  let dragging = false;
  const fromPointer = (e) => {
    const box = svg.getBoundingClientRect();
    const f = clamp(((e.clientX - box.left) / box.width - 0.12) / 0.76, 0, 1);
    return -1 + f * 7;
  };
  stage.addEventListener("pointerdown", (e) => { dragging = true; try { stage.setPointerCapture(e.pointerId); } catch (_) {} steer(fromPointer(e)); });
  stage.addEventListener("pointermove", (e) => { if (dragging) steer(fromPointer(e)); });
  const release = () => { dragging = false; };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("focus", () => { if (touring) { touring = false; target = Math.round(shown); run(); } });
  still.addEventListener && still.addEventListener("change", () => { if (still.matches) touring = false; run(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
  } else { visible = true; run(); }
  if (touring) tourClock = TOUR.indexOf(3) * HOLD; // empieza en miércoles y sigue la gira
  draw(0);
})();
