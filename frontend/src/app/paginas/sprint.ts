import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Avatar } from '../componentes/avatar';
import { Burndown } from '../componentes/burndown';
import { Confeti } from '../componentes/confeti';
import { DiagramaFig } from '../componentes/diagrama';
import { Figura } from '../componentes/figura';
import { conTransicion } from '../core/movimiento';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Icono } from '../componentes/icono';
import { Kpi } from '../componentes/kpi';
import { COLOR_PERSONA, DIAS, NOMBRE_TIPO, Sprint, Tarea } from '../core/modelos';

type Vista = 'tabla' | 'tablero' | 'calendario' | 'carga' | 'maquina';
type Columna = 'pendiente' | 'curso' | 'hecho';

@Component({
  selector: 'app-sprint',
  imports: [Avatar, Burndown, DiagramaFig, Encabezado, Estado, Figura, Icono, Kpi],
  template: `
    <app-encabezado titulo="Sprint backlog" icono="tablero" etiqueta="Criterio 3 · 20 %">
      <span entrada>Las tres historias seleccionadas, desglosadas en tareas con responsable y tiempo estimado. Además del
        documento, el portal ubica cada tarea en los cinco días del sprint.</span>
    </app-encabezado>

    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.value()?.tareas?.length" (reintentar)="r.reload()">
      @if (r.value(); as d) {
        <section class="panel mb-6 flex flex-wrap items-center gap-4 border-l-4 !border-l-forest">
          <app-icono nombre="bandera" clase="h-6 w-6 text-forest" />
          <p class="min-w-0 flex-1 text-[15px] text-forest"><span class="seccion !mb-0 block">Objetivo del sprint</span>{{ d.objetivo_sprint.charAt(0).toUpperCase() + d.objetivo_sprint.slice(1) }}</p>
        </section>

        <section class="stagger-children grid grid-cols-2 gap-3 md:grid-cols-4">
          @for (h of d.historias; track h.id) {
            <app-kpi [etiqueta]="h.id + ' · ' + h.puntos + ' pts'" [valor]="h.horas + ' h'" [detalle]="h.n_tareas + ' tareas · ' + h.prioridad" icono="pila" />
          }
          <app-kpi etiqueta="Total" [valor]="total() + ' h'" [detalle]="d.tareas.length + ' tareas · 16 pts'" icono="reloj" />
        </section>

        <div class="mt-8 flex flex-wrap gap-1 rounded-xl border border-fog bg-white p-1" role="tablist" aria-label="Vistas del sprint backlog">
          @for (v of vistas; track v.id) {
            <button type="button" role="tab" [attr.aria-selected]="vista() === v.id" (click)="cambiarVista(v.id)"
                    class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition"
                    [class]="vista() === v.id ? 'bg-forest text-white shadow' : 'text-evergreen hover:bg-acento-suave'">
              <app-icono [nombre]="v.icono" clase="h-4 w-4" /> {{ v.texto }}</button>
          }
        </div>

        <!-- ── Tabla (lo que pide el enunciado) ── -->
        @if (vista() === 'tabla') {
          <section class="mt-4 grid gap-4 animate-fadeIn">
            @for (h of d.historias; track h.id) {
              <article class="panel !p-0 overflow-hidden">
                <header class="flex flex-wrap items-center gap-3 border-b border-fog/60 bg-acento-suave/50 px-4 py-3">
                  <span class="rounded-md bg-forest px-2 py-0.5 font-mono text-xs font-semibold text-white">{{ h.id }}</span>
                  <p class="min-w-0 flex-1 text-sm text-evergreen">{{ h.texto }}</p>
                  <span class="font-mono text-xs text-moss">{{ h.puntos }} pts · {{ h.horas }} h</span>
                </header>
                <div class="overflow-x-auto">
                  <table class="tabla min-w-[40rem]">
                    <thead><tr><th class="w-10">#</th><th>Tarea</th><th>Responsable</th><th class="text-right">Horas</th><th>Días</th></tr></thead>
                    <tbody>
                      @for (t of tareasDe(h.id); track t.id) {
                        <tr>
                          <td class="font-mono text-moss">{{ t.id }}</td>
                          <td><span class="text-forest">{{ t.nombre }}</span><span class="ml-2 rounded bg-acento-suave px-1.5 font-mono text-[10px] text-pine">{{ tipo[t.tipo] }}</span></td>
                          <td><span class="inline-flex items-center gap-2 whitespace-nowrap"><app-avatar [id]="t.responsable_id" [nombre]="t.responsable" />{{ t.responsable }}</span></td>
                          <td class="text-right font-mono tabular-nums">{{ t.horas }}</td>
                          <td class="whitespace-nowrap font-mono text-xs text-moss">{{ dias[t.dia_inicio - 1] }}{{ t.dia_fin > t.dia_inicio ? '–' + dias[t.dia_fin - 1] : '' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </article>
            }
            <p class="text-xs text-tenue">{{ d.nota }}</p>
          </section>
        }

        <!-- ── Tablero Kanban recorriendo la semana ── -->
        @if (vista() === 'tablero') {
          <section class="mt-4 animate-fadeIn">
            <div class="panel mb-4 flex flex-wrap items-center gap-4">
              <button type="button" class="boton" (click)="reproducir()" [attr.aria-label]="reproduciendo() ? 'Pausar' : 'Reproducir la semana'">
                <app-icono [nombre]="reproduciendo() ? 'pausa' : 'reproducir'" clase="h-4 w-4" /> {{ reproduciendo() ? 'Pausar' : 'Reproducir' }}</button>
              <label class="flex min-w-60 flex-1 items-center gap-3 text-sm">
                <span class="sr-only">Momento del sprint</span>
                <input type="range" min="0" max="5" step="1" [value]="momento()" (input)="irA(+$any($event.target).value)" class="w-full accent-[#04202C]" />
              </label>
              <p class="font-mono text-sm text-forest" aria-live="polite">{{ etiquetaMomento() }}</p>
            </div>
            <!-- Progreso del sprint -->
            <div class="mb-4 h-2 overflow-hidden rounded-full bg-fog/60" role="img" [attr.aria-label]="pctHecho() + ' % de las horas terminadas'">
              <div class="h-full rounded-full bg-gradient-to-r from-[#2E9E7A] to-[#04202C] transition-all duration-700" [style.width.%]="pctHecho()"></div>
            </div>
            <div #tablero class="grid gap-4 md:grid-cols-3">
              @for (c of columnas; track c.id) {
                <div class="rounded-xl border border-fog bg-acento-suave/40 p-3">
                  <h3 class="mb-3 flex items-center justify-between font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-moss">
                    {{ c.texto }} <span class="rounded-full bg-white px-2 py-0.5 text-forest">{{ enColumna(c.id).length }} · {{ horasDe(enColumna(c.id)) }} h</span></h3>
                  <ul class="grid gap-2">
                    @for (t of enColumna(c.id); track t.id) {
                      <li class="rounded-lg border border-fog bg-white p-3 shadow-sm transition-shadow hover:shadow-md" [attr.style]="estiloTarjeta(t)">
                        <p class="text-sm leading-snug text-forest">{{ t.nombre }}</p>
                        <p class="mt-2 flex items-center justify-between gap-2 text-xs text-tenue">
                          <span class="inline-flex items-center gap-1.5"><app-avatar [id]="t.responsable_id" [nombre]="t.responsable" />{{ t.responsable.split(' ')[0] }}</span>
                          <span class="font-mono">{{ t.historia_id }} · {{ t.horas }} h</span></p>
                      </li>
                    } @empty { <li class="rounded-lg border border-dashed border-fog p-4 text-center text-xs text-moss">Sin tareas</li> }
                  </ul>
                </div>
              }
            </div>
          </section>
        }

        <!-- ── Calendario: personas × días ── -->
        @if (vista() === 'calendario') {
          <section class="panel mt-4 overflow-x-auto animate-fadeIn">
            <div class="grid min-w-[52rem] grid-cols-[10rem_repeat(5,1fr)] gap-1.5">
              <span></span>
              @for (dia of dias; track dia) { <span class="text-center font-mono text-[11px] uppercase tracking-wider text-moss">{{ dia }}</span> }
              <span class="flex items-center font-mono text-[10px] uppercase tracking-wider text-moss">Eventos</span>
              @for (dia of dias; track dia; let k = $index) {
                <div class="grid gap-1">
                  @for (e of eventosDel(k + 1); track e.id) {
                    <span class="rounded-md bg-forest px-2 py-1 text-[11px] text-white" [title]="e.descripcion">{{ e.hora }} · {{ e.nombre }}</span>
                  }
                </div>
              }
              @for (p of d.carga; track p.integrante_id) {
                <span class="flex items-center gap-2 text-sm text-forest"><app-avatar [id]="p.integrante_id" [nombre]="p.nombre" />{{ p.nombre.split(' ')[0] }}</span>
                @for (dia of dias; track dia; let k = $index) {
                  <div class="grid min-h-14 content-start gap-1 rounded-lg bg-acento-suave/50 p-1">
                    @for (t of tareasDelDia(p.integrante_id, k + 1); track t.id) {
                      <span class="rounded-md px-2 py-1 text-[11px] leading-snug text-white" [style.background]="color(t.responsable_id)" [title]="t.nombre + ' · ' + t.horas + ' h'">
                        <span class="font-mono">{{ t.id }}</span> {{ corto(t.nombre) }}</span>
                    }
                  </div>
                }
              }
            </div>
            <p class="mt-3 text-xs text-tenue">Pasa el puntero sobre una tarea para ver su nombre completo y sus horas. Calendario: ampliación del portal.</p>
          </section>
          <h3 class="seccion mt-6">El mismo sprint como diagrama de Gantt</h3>
          <app-diagrama id="gantt-sprint" />
        }

        <!-- ── La máquina (figura isométrica) ── -->
        @if (vista() === 'maquina') {
          <div class="mt-4 animate-fadeIn">
            <app-figura carpeta="anatomia" titulo="Anatomía de un sprint de una semana" alto="46rem"
                        pie="El sprint como línea de montaje: backlog → planning → trabajo diario → incremento → retrospectiva" />
          </div>
        }

        <!-- ── Carga por persona y día ── -->
        @if (vista() === 'carga') {
          <section class="mt-4 grid gap-6 lg:grid-cols-[1fr_1fr] animate-fadeIn">
            <div class="panel overflow-x-auto">
              <h3 class="seccion">Horas por persona y día</h3>
              <table class="tabla min-w-[28rem]">
                <thead><tr><th>Persona</th>@for (dia of dias; track dia) {<th class="text-center">{{ dia }}</th>}<th class="text-right">Total</th></tr></thead>
                <tbody>
                  @for (p of d.carga; track p.integrante_id) {
                    <tr><td class="whitespace-nowrap"><span class="inline-flex items-center gap-2"><app-avatar [id]="p.integrante_id" [nombre]="p.nombre" />{{ p.nombre.split(' ')[0] }}</span></td>
                      @for (h of p.por_dia; track $index) {
                        <td class="text-center"><span class="inline-block min-w-11 rounded-md px-1.5 py-1 font-mono text-xs tabular-nums"
                            [style.background]="'rgba(4,32,44,' + (h / 6) * 0.85 + ')'" [class]="h / 6 > 0.5 ? 'text-white' : 'text-forest'">{{ h ? redondo(h) : '—' }}</span></td>
                      }
                      <td class="text-right font-mono font-semibold">{{ p.horas }} h</td></tr>
                  }
                </tbody>
              </table>
              <p class="mt-3 text-xs text-tenue">Más oscuro = más horas (máximo de referencia: 6 h por día). Las tareas de varios días reparten sus horas por igual.</p>
            </div>
            <div class="panel"><h3 class="seccion">Burndown planeado</h3><app-burndown [datos]="d.burndown" /></div>
          </section>
        }
      }
    </app-estado>
  `,
})
export class SprintPagina {
  protected readonly r = httpResource<Sprint>(() => '/api/sprint');
  protected readonly dias = DIAS;
  protected readonly tipo = NOMBRE_TIPO;
  protected readonly vista = signal<Vista>('tabla');
  protected readonly vistas: { id: Vista; texto: string; icono: 'lista' | 'tablero' | 'calendario' | 'grafica' | 'cubo' }[] = [
    { id: 'tabla', texto: 'Tabla', icono: 'lista' },
    { id: 'tablero', texto: 'Tablero', icono: 'tablero' },
    { id: 'calendario', texto: 'Calendario', icono: 'calendario' },
    { id: 'carga', texto: 'Carga y burndown', icono: 'grafica' },
    { id: 'maquina', texto: 'La máquina', icono: 'cubo' },
  ];
  protected readonly columnas: { id: Columna; texto: string }[] = [
    { id: 'pendiente', texto: 'Por hacer' }, { id: 'curso', texto: 'En curso' }, { id: 'hecho', texto: 'Hecho' },
  ];
  /** 0 = lunes 9:00 (tras el planning); k = cierre del día k. */
  protected readonly momento = signal(0);
  protected readonly reproduciendo = signal(false);
  private temporizador: ReturnType<typeof setInterval> | undefined;
  protected readonly total = computed(() => (this.r.value()?.tareas ?? []).reduce((a, t) => a + t.horas, 0));
  protected readonly etiquetaMomento = computed(() => {
    const m = this.momento();
    return m === 0 ? 'Lunes 9:00 · sprint planning' : m === 5 ? 'Viernes · sprint review' : `Cierre del ${['', 'lunes', 'martes', 'miércoles', 'jueves'][m]}`;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.temporizador));
  }

  private readonly confeti = inject(Confeti);
  private readonly tablero = viewChild<ElementRef<HTMLElement>>('tablero');
  protected readonly pctHecho = computed(() => {
    const ts = this.r.value()?.tareas ?? [];
    const total = ts.reduce((a, t) => a + t.horas, 0);
    return total ? Math.round((this.horasDe(ts.filter((t) => this.columnaDe(t) === 'hecho')) / total) * 100) : 0;
  });

  protected cambiarVista(v: Vista) {
    conTransicion(() => this.vista.set(v));
  }
  /** Cambia el momento de la semana; las tarjetas vuelan de columna y al cerrar el viernes hay confeti. */
  protected irA(m: number) {
    const antes = this.momento();
    conTransicion(() => this.momento.set(m));
    if (m === 5 && antes < 5) setTimeout(() => this.confeti.desde(this.tablero()?.nativeElement, 160), 700);
  }
  protected estiloTarjeta(t: Tarea) {
    return `border-left: 4px solid ${this.color(t.responsable_id)}; view-transition-name: tarjeta-${t.id}; view-transition-class: tarjeta;`;
  }

  protected tareasDe(h: string) {
    return (this.r.value()?.tareas ?? []).filter((t) => t.historia_id === h);
  }
  protected columnaDe(t: Tarea): Columna {
    const m = this.momento();
    // Al cierre del día m: terminada si su último día ya pasó; en curso si empezó pero sigue al día siguiente
    return t.dia_fin <= m ? 'hecho' : t.dia_inicio <= m ? 'curso' : 'pendiente';
  }
  protected enColumna(c: Columna) {
    return (this.r.value()?.tareas ?? []).filter((t) => this.columnaDe(t) === c);
  }
  protected horasDe(ts: Tarea[]) {
    return ts.reduce((a, t) => a + t.horas, 0);
  }
  protected eventosDel(dia: number) {
    return (this.r.value()?.eventos ?? []).filter((e) => e.dia === dia);
  }
  protected tareasDelDia(persona: number, dia: number) {
    return (this.r.value()?.tareas ?? []).filter((t) => t.responsable_id === persona && t.dia_inicio <= dia && t.dia_fin >= dia);
  }
  protected color(id: number) {
    return COLOR_PERSONA[id];
  }
  protected corto(n: string) {
    return n.length > 34 ? n.slice(0, 32) + '…' : n;
  }
  protected redondo(h: number) {
    return Number.isInteger(h) ? `${h}` : h.toFixed(1);
  }
  protected reproducir() {
    if (this.reproduciendo()) {
      clearInterval(this.temporizador);
      this.reproduciendo.set(false);
      return;
    }
    if (this.momento() === 5) this.irA(0);
    this.reproduciendo.set(true);
    this.temporizador = setInterval(() => {
      if (this.momento() >= 5) {
        clearInterval(this.temporizador);
        this.reproduciendo.set(false);
      } else this.irA(this.momento() + 1);
    }, 1200);
  }
}
