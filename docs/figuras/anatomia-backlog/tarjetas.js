/*
 * Dibujo de una tarjeta de historia a partir de su pose (BacklogModelo.pose). Lo usan el build (estado
 * inicial en el HTML) y figura.js (cada cuadro). La tarjeta se reconstruye entera porque gira y crece.
 */
(function (global) {
  "use strict";

  function make(K, M) {
    const PL = M.PLANO;
    const fx = (v) => Math.round(v * 1000) / 1000;

    // Rectángulo en planta girado: u a lo ancho de la tarjeta, n hacia su cara frontal.
    function plan(cx, cy, u, n, a0, a1, b0, b1) {
      return [
        [cx + u[0] * a0 + n[0] * b0, cy + u[1] * a0 + n[1] * b0],
        [cx + u[0] * a1 + n[0] * b0, cy + u[1] * a1 + n[1] * b0],
        [cx + u[0] * a1 + n[0] * b1, cy + u[1] * a1 + n[1] * b1],
        [cx + u[0] * a0 + n[0] * b1, cy + u[1] * a0 + n[1] * b1],
      ];
    }

    // Matriz que pone texto sobre la cara frontal: x del texto a lo largo de u, y del texto hacia abajo.
    function faceMatrix(at, u, P) {
      const o = K.iso(at, P);
      const a = K.iso([at[0] + u[0], at[1] + u[1], at[2]], P);
      const b = K.iso([at[0], at[1], at[2] - 1], P);
      return `matrix(${fx(a[0] - o[0])} ${fx(a[1] - o[1])} ${fx(b[0] - o[0])} ${fx(b[1] - o[1])} ${fx(o[0])} ${fx(o[1])})`;
    }

    function svg(p, P) {
      const h = M.porId[p.id];
      const u = [Math.cos(p.giro), Math.sin(p.giro)];
      const n = [-Math.sin(p.giro), Math.cos(p.giro)];
      const hw = PL.ancho / 2;
      const ht = PL.grueso / 2;
      const top = p.z + p.alto;
      const out = [];
      const ring = plan(p.x, p.y, u, n, -hw, hw, -ht, ht);
      const body = K.extrude(ring, p.z, p.alto, P, { bevel: 0.35 });
      // Pestaña de índice: más delgada que la tarjeta, al ras de su cara trasera.
      const tab = K.extrude(plan(p.x, p.y, u, n, hw - 6, hw - 1.2, -ht, ht - 0.8), top, 2, P, { bevel: 0.25 });
      const face = ht + 0.02;
      const at = (s, z) => [p.x + u[0] * s + n[0] * face, p.y + u[1] * s + n[1] * face, z];
      // Regla del encabezado: rodea las caras visibles y acaba en la silueta.
      const rule = K.ringSeam(ring, top - 3.6, P);
      const text =
        K.faceTextSvg(faceMatrix(at(-hw + 1.2, top - 1.1), u, P), p.id, { size: 2.3, tone: "hi" }) +
        K.faceTextSvg(faceMatrix(at(hw - 1.2, p.z + 1.25), u, P), p.estimada ? String(h.puntos) : "?", {
          size: 2.3,
          tone: "lo",
          anchor: "end",
        });
      out.push(K.solidSvg(body, { tone: "hi", crease: "lo", inner: K.lineSvg(rule, { tone: "lo" }) + text }));
      out.push(K.solidSvg(tab, { tone: "hi", crease: "lo" }));
      return out.join("");
    }

    const key = (p, P) => K.depthOf([p.x, p.y, 0], P);
    const clase = (p) => (p.enSprint ? "bl-card is-done" : p.grande ? "bl-card is-warn" : "bl-card");

    return { svg, key, clase };
  }

  global.BacklogTarjetas = { make };
})(typeof window !== "undefined" ? window : globalThis);
