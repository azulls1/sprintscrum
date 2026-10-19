import { Component, computed, input, signal } from '@angular/core';
import { PuntoBurndown } from '../core/modelos';

/**
 * Burndown en SVG: línea ideal (punteada), plan del sprint y, si viene de la simulación, la mediana con la banda
 * P10–P90. Un solo eje (horas pendientes). Pasar el puntero por un día muestra sus valores.
 */
@Component({
  selector: 'app-burndown',
  template: `
    <figure class="min-w-0">
      <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tenue" aria-hidden="true">
        <span class="flex items-center gap-1.5"><svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#9EADA3" stroke-width="2" stroke-dasharray="4 3" /></svg> Ideal</span>
        <span class="flex items-center gap-1.5"><svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#04202C" stroke-width="2" /></svg> Plan</span>
        @if (conBanda()) {
          <span class="flex items-center gap-1.5"><svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#2A78A8" stroke-width="2" /></svg> Mediana simulada</span>
          <span class="flex items-center gap-1.5"><span class="inline-block h-2.5 w-5 rounded-sm bg-[#2A78A8]/20"></span> P10–P90</span>
        }
      </div>
      <div class="relative">
        @for (v of [version()]; track v) {
        <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="h-auto w-full" role="img" [attr.aria-label]="descripcion()">
          @for (g of rejilla(); track g.v) {
            <line [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="g.y" [attr.y2]="g.y" stroke="#DFE4E0" stroke-width="1" />
            <text [attr.x]="M.l - 8" [attr.y]="g.y + 4" text-anchor="end" class="fill-moss font-mono text-[11px]">{{ g.v }}</text>
          }
          @for (p of datos(); track p.dia; let i = $index) {
            <text [attr.x]="x(i)" [attr.y]="H - 8" text-anchor="middle" class="fill-moss font-mono text-[11px]">{{ p.dia }}</text>
          }
          <text [attr.x]="M.l" y="12" class="fill-moss font-mono text-[10px]">horas pendientes</text>
          @if (conBanda()) {
            <path [attr.d]="banda()" fill="#2A78A8" fill-opacity="0.16" class="banda-entra" />
            <path [attr.d]="linea('p50')" fill="none" stroke="#2A78A8" stroke-width="2" stroke-linejoin="round" pathLength="1" class="trazo trazo--3" />
          }
          <path [attr.d]="linea('ideal')" fill="none" stroke="#9EADA3" stroke-width="2" stroke-dasharray="5 4" class="animate-fadeIn" />
          <path [attr.d]="linea('plan')" fill="none" stroke="#04202C" stroke-width="2" stroke-linejoin="round" pathLength="1" class="trazo" />
          @for (p of datos(); track p.dia; let i = $index) {
            <circle [attr.cx]="x(i)" [attr.cy]="y(p.plan)" r="4" fill="#04202C" stroke="#fff" stroke-width="2" class="punto-pop" [style.animation-delay.ms]="250 + i * 200" />
          }
          @if (activo() !== null) {
            <line [attr.x1]="x(activo()!)" [attr.x2]="x(activo()!)" [attr.y1]="M.t" [attr.y2]="H - M.b" stroke="#5B7065" stroke-width="1" />
          }
          <!-- zonas de puntero, más anchas que la marca -->
          @for (p of datos(); track p.dia; let i = $index) {
            <rect [attr.x]="x(i) - paso() / 2" [attr.y]="M.t" [attr.width]="paso()" [attr.height]="H - M.t - M.b" fill="transparent"
                  (pointerenter)="activo.set(i)" (pointerleave)="activo.set(null)" />
          }
        </svg>
        }
        @if (activo() !== null) {
          @let p = datos()[activo()!];
          <div class="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-fog bg-white px-3 py-2 text-xs shadow-lg"
               [style.left.%]="(x(activo()!) / W) * 100" [style.transform]="activo()! > 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)'">
            <p class="mb-1 font-mono text-[10px] uppercase tracking-wider text-moss">Cierre · {{ p.dia }}</p>
            <p class="flex justify-between gap-4"><span class="text-tenue">Ideal</span><span class="font-mono text-forest">{{ p.ideal }} h</span></p>
            <p class="flex justify-between gap-4"><span class="text-tenue">Plan</span><span class="font-mono text-forest">{{ p.plan }} h</span></p>
            @if (p.p50 != null) {
              <p class="flex justify-between gap-4"><span class="text-tenue">Mediana</span><span class="font-mono text-forest">{{ p.p50 }} h</span></p>
              <p class="flex justify-between gap-4"><span class="text-tenue">P10–P90</span><span class="font-mono text-forest">{{ p.p10 }}–{{ p.p90 }} h</span></p>
            }
          </div>
        }
      </div>
      <figcaption class="sr-only">
        <table><tr><th>Día</th><th>Ideal</th><th>Plan</th>@if (conBanda()) {<th>P10</th><th>Mediana</th><th>P90</th>}</tr>
          @for (p of datos(); track p.dia) {<tr><td>{{ p.dia }}</td><td>{{ p.ideal }}</td><td>{{ p.plan }}</td>@if (conBanda()) {<td>{{ p.p10 }}</td><td>{{ p.p50 }}</td><td>{{ p.p90 }}</td>}</tr>}
        </table>
      </figcaption>
    </figure>
  `,
})
export class Burndown {
  readonly datos = input.required<PuntoBurndown[]>();
  protected readonly W = 640;
  protected readonly H = 280;
  protected readonly M = { t: 22, r: 16, b: 28, l: 40 };
  protected readonly activo = signal<number | null>(null);
  /** Cambia con los datos: vuelve a montar el SVG para que las líneas se dibujen de nuevo. */
  protected readonly version = computed(() => this.datos().map((p) => `${p.plan}:${p.p50 ?? ''}`).join('|'));
  protected readonly conBanda = computed(() => this.datos().some((p) => p.p50 != null));
  private readonly maximo = computed(() => {
    const m = Math.max(...this.datos().flatMap((p) => [p.ideal, p.plan, p.p90 ?? 0]));
    return Math.ceil(m / 10) * 10;
  });
  protected readonly paso = computed(() => (this.W - this.M.l - this.M.r) / Math.max(this.datos().length - 1, 1));
  protected readonly rejilla = computed(() => {
    const max = this.maximo();
    return [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: Math.round(max * f), y: this.y(max * f) }));
  });
  protected readonly descripcion = computed(() =>
    `Burndown del sprint: de ${this.datos()[0]?.plan} horas el lunes a ${this.datos().at(-1)?.plan} horas el viernes según el plan.`);

  protected x(i: number) {
    return this.M.l + i * this.paso();
  }
  protected y(v: number) {
    return this.M.t + (1 - v / this.maximo()) * (this.H - this.M.t - this.M.b);
  }
  protected linea(k: 'ideal' | 'plan' | 'p50') {
    return this.datos().map((p, i) => `${i ? 'L' : 'M'}${this.x(i).toFixed(1)},${this.y(p[k] ?? 0).toFixed(1)}`).join(' ');
  }
  protected banda() {
    const d = this.datos();
    const arriba = d.map((p, i) => `${i ? 'L' : 'M'}${this.x(i).toFixed(1)},${this.y(p.p90 ?? 0).toFixed(1)}`).join(' ');
    const abajo = [...d].reverse().map((p, k) => `L${this.x(d.length - 1 - k).toFixed(1)},${this.y(p.p10 ?? 0).toFixed(1)}`).join(' ');
    return `${arriba} ${abajo} Z`;
  }
}
