import { Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Icono } from '../componentes/icono';
import { DiagramaFig } from '../componentes/diagrama';
import { Figura } from '../componentes/figura';
import { Kpi } from '../componentes/kpi';
import { PlanningPoker } from '../componentes/planning-poker';
import { Revelar } from '../componentes/revelar';
import { Backlog, Historia, Prioridad } from '../core/modelos';

const FIBONACCI = [1, 2, 3, 5, 8, 13];

@Component({
  selector: 'app-backlog',
  imports: [DiagramaFig, Encabezado, Estado, Figura, Icono, Kpi, PlanningPoker, Revelar],
  template: `
    <app-encabezado titulo="Product backlog" icono="pila" etiqueta="Criterio 2 · 20 %">
      <span entrada>Ocho historias de usuario ordenadas por prioridad, con su estimación en puntos de historia. Las tres
        primeras forman el sprint: sin poder reservar una cita, nada de lo demás sirve.</span>
    </app-encabezado>

    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.value()?.historias?.length" (reintentar)="r.reload()">
      @if (r.value(); as d) {
        <section class="stagger-children grid grid-cols-2 gap-3 md:grid-cols-4">
          <app-kpi etiqueta="Historias" [valor]="'' + d.historias.length" detalle="mínimo pedido: 5" icono="pila" />
          <app-kpi etiqueta="Puntos totales" [valor]="'' + puntos(d.historias)" detalle="serie de Fibonacci" icono="datos" />
          <app-kpi etiqueta="En el sprint" [valor]="puntos(enSprint()) + ' pts'" [detalle]="pctSprint() + ' del backlog'" icono="diana" />
          <app-kpi etiqueta="Prioridad alta" [valor]="'' + porPrioridad('Alta').length" detalle="todas entran al sprint" icono="bandera" />
        </section>

        <!-- Figura isométrica: la máquina que prioriza y selecciona -->
        <h2 class="seccion mt-8">Cómo se llega a las 3 historias del sprint</h2>
        <div appRevelar><app-figura carpeta="anatomia-backlog" titulo="Máquina clasificadora del product backlog" alto="48rem"
             pie="Mueve los pasos: mezclado → priorizar → estimar → seleccionar el sprint" /></div>

        <!-- Juego -->
        <div class="mt-8" appRevelar><app-planning-poker [historias]="d.historias" /></div>

        <!-- Esfuerzo frente a prioridad: dónde cae cada historia -->
        <h2 class="seccion mt-8">Mapa del backlog · prioridad × esfuerzo</h2>
        <section class="panel overflow-x-auto" appRevelar>
          <div class="grid min-w-[40rem] grid-cols-[6rem_repeat(6,1fr)] gap-1.5">
            <span></span>
            @for (f of fib; track f) { <span class="text-center font-mono text-[11px] text-moss">{{ f }} pts</span> }
            @for (p of prioridades; track p) {
              <span class="flex items-center font-mono text-[11px] uppercase tracking-wider text-moss">{{ p }}</span>
              @for (f of fib; track f) {
                <div class="flex min-h-16 flex-wrap content-start gap-1 rounded-lg bg-acento-suave/60 p-1.5">
                  @for (h of celda(p, f); track h.id) {
                    <button type="button" (click)="abierta.set(h.id)" [attr.aria-label]="h.id + ': ' + h.texto"
                            class="ondea rounded-md px-2 py-1 font-mono text-[11px] font-medium transition hover:-translate-y-px hover:shadow-md"
                            [class]="h.en_sprint ? 'bg-forest text-white' : 'border border-fog bg-white text-forest'">{{ h.id }}</button>
                  }
                </div>
              }
            }
          </div>
          <p class="mt-3 flex items-center gap-3 text-xs text-tenue"><span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-forest"></span> En el sprint</span>
            <span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded border border-fog bg-white"></span> Siguientes sprints</span></p>
        </section>

        <div class="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 class="seccion !mb-0">Historias de usuario</h2>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por prioridad">
            @for (f of filtros; track f) {
              <button type="button" (click)="filtro.set(f)" [attr.aria-pressed]="filtro() === f"
                      class="rounded-full border px-3 py-1 text-xs transition"
                      [class]="filtro() === f ? 'border-forest bg-forest text-white' : 'border-fog bg-white text-evergreen hover:border-forest'">{{ f }}</button>
            }
          </div>
        </div>
        <section class="grid gap-3">
          @for (h of filtradas(); track h.id; let i = $index) {
            <article class="panel !p-0 overflow-hidden animate-fadeInUp" [style.animation-delay.ms]="i * 60" [class.ring-2]="abierta() === h.id" [class.ring-forest]="abierta() === h.id">
              <button type="button" class="flex w-full items-start gap-4 p-4 text-left" (click)="abierta.set(abierta() === h.id ? null : h.id)" [attr.aria-expanded]="abierta() === h.id">
                <span class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl font-display" [class]="h.en_sprint ? 'bg-forest text-white' : 'bg-acento-suave text-forest'">
                  <span class="text-lg font-semibold leading-none">{{ h.puntos }}</span><span class="text-[9px] uppercase opacity-70">pts</span></span>
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center gap-2"><span class="font-mono text-xs font-semibold text-forest">{{ h.id }}</span>
                    <span class="etiqueta" [class]="claseP(h.prioridad)">{{ h.prioridad }}</span>
                    @if (h.en_sprint) { <span class="etiqueta bg-forest text-white">Sprint 1</span> }</span>
                  <span class="mt-1 block text-[15px] leading-relaxed text-evergreen" [innerHTML]="resaltar(h.texto)"></span>
                </span>
                <app-icono nombre="flecha" clase="mt-1 h-4 w-4 text-moss transition" [class.rotate-90]="abierta() === h.id" />
              </button>
              @if (abierta() === h.id) {
                <div class="border-t border-fog/60 bg-acento-suave/40 px-4 py-3 text-sm animate-fadeIn">
                  @if (h.criterios.length) {
                    <p class="seccion !mb-2">Criterios de aceptación <span class="normal-case tracking-normal text-moss">(ampliación del portal)</span></p>
                    <ul class="grid gap-1.5">
                      @for (c of h.criterios; track $index) { <li class="flex gap-2 text-evergreen"><app-icono nombre="check" clase="mt-0.5 h-4 w-4 text-bien" />{{ c }}</li> }
                    </ul>
                  } @else {
                    <p class="text-tenue">Queda en el product backlog para un sprint posterior; sus criterios se detallan cuando se acerque a la cima.</p>
                  }
                </div>
              }
            </article>
          }
        </section>
        <p class="mt-3 text-xs text-tenue">{{ d.nota }}</p>

        <h2 class="seccion mt-8">Mapa de historias por actividad</h2>
        <div appRevelar><app-diagrama id="product-backlog" /></div>
      }
    </app-estado>
  `,
})
export class BacklogPagina {
  protected readonly r = httpResource<Backlog>(() => '/api/backlog');
  protected readonly fib = FIBONACCI;
  protected readonly prioridades: Prioridad[] = ['Alta', 'Media', 'Baja'];
  protected readonly filtros = ['Todas', 'Alta', 'Media', 'Baja', 'En el sprint'];
  protected readonly filtro = signal('Todas');
  protected readonly abierta = signal<string | null>(null);
  protected readonly enSprint = computed(() => (this.r.value()?.historias ?? []).filter((h) => h.en_sprint));
  protected readonly pctSprint = computed(() => {
    const t = this.puntos(this.r.value()?.historias ?? []);
    return t ? `${Math.round((this.puntos(this.enSprint()) / t) * 100)} %` : '—';
  });
  protected readonly filtradas = computed(() => {
    const f = this.filtro();
    const hs = this.r.value()?.historias ?? [];
    return f === 'Todas' ? hs : f === 'En el sprint' ? hs.filter((h) => h.en_sprint) : hs.filter((h) => h.prioridad === f);
  });

  protected puntos(hs: Historia[]) {
    return hs.reduce((a, h) => a + h.puntos, 0);
  }
  protected porPrioridad(p: Prioridad) {
    return (this.r.value()?.historias ?? []).filter((h) => h.prioridad === p);
  }
  protected celda(p: Prioridad, f: number) {
    return (this.r.value()?.historias ?? []).filter((h) => h.prioridad === p && h.puntos === f);
  }
  protected claseP(p: Prioridad) {
    return p === 'Alta' ? 'bg-forest/10 text-forest' : p === 'Media' ? 'bg-aviso-suave text-aviso' : 'bg-acento-suave text-pine';
  }
  /** «Como… quiero… para…» con las tres partes resaltadas (texto propio de la base, se escapa antes). */
  protected resaltar(t: string) {
    const e = t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
    return e.replace(/^(Como)/, '<strong class="text-forest">$1</strong>')
      .replace(/ (quiero) /, ' <strong class="text-forest">$1</strong> ')
      .replace(/ (para) /, ' <strong class="text-forest">$1</strong> ');
  }
}
