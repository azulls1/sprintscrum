import { Injectable } from '@angular/core';
import { sinMovimiento } from '../core/movimiento';

const COLORES = ['#04202C', '#2A78A8', '#D9822B', '#2E9E7A', '#9B6BC9', '#9EADA3'];

interface Pieza { x: number; y: number; vx: number; vy: number; giro: number; vg: number; w: number; h: number; color: string; vida: number }

/** Confeti en un canvas temporal sobre la página. Sin dependencias; no hace nada con movimiento reducido. */
@Injectable({ providedIn: 'root' })
export class Confeti {
  private activo = false;

  lanzar(origen?: { x: number; y: number }, cantidad = 140) {
    if (sinMovimiento() || this.activo || typeof document === 'undefined') return;
    this.activo = true;
    const lienzo = document.createElement('canvas');
    lienzo.setAttribute('aria-hidden', 'true');
    Object.assign(lienzo.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '60' });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = innerWidth * dpr;
    lienzo.height = innerHeight * dpr;
    document.body.appendChild(lienzo);
    const ctx = lienzo.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const o = origen ?? { x: innerWidth / 2, y: innerHeight * 0.35 };
    const piezas: Pieza[] = Array.from({ length: cantidad }, () => {
      const ang = Math.random() * Math.PI * 2;
      const vel = 4 + Math.random() * 7;
      return { x: o.x, y: o.y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 6, giro: Math.random() * 6, vg: (Math.random() - 0.5) * 0.4,
               w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, color: COLORES[Math.floor(Math.random() * COLORES.length)], vida: 0 };
    });
    const paso = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let vivas = 0;
      for (const p of piezas) {
        p.vida++;
        p.vy += 0.22; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.giro += p.vg;
        if (p.y > innerHeight + 20 || p.vida > 220) continue;
        vivas++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.giro);
        ctx.globalAlpha = Math.max(0, 1 - p.vida / 220);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.giro * 2)) + 1);
        ctx.restore();
      }
      if (vivas) requestAnimationFrame(paso);
      else { lienzo.remove(); this.activo = false; }
    };
    requestAnimationFrame(paso);
  }

  /** Confeti saliendo del elemento indicado. */
  desde(el: Element | null | undefined, cantidad?: number) {
    const r = el?.getBoundingClientRect();
    this.lanzar(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined, cantidad);
  }
}
