import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Burndown } from '../componentes/burndown';
import { Confeti } from '../componentes/confeti';
import { DiagramaFig } from '../componentes/diagrama';
import { Figura } from '../componentes/figura';
import { Revelar } from '../componentes/revelar';
import { Encabezado } from '../componentes/encabezado';
import { Icono } from '../componentes/icono';
import { Kpi } from '../componentes/kpi';
import { COLOR_PERSONA, ParametrosSimulacion, Simulacion } from '../core/modelos';

const DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

@Component({
  selector: 'app-simulacion',
  imports: [Burndown, DiagramaFig, Encabezado, Figura, Icono, Kpi, Revelar],
  template: `
    <app-encabezado titulo="Simulación del sprint" icono="burndown" etiqueta="En vivo · Celery + Redis">
      <span entrada>¿Qué tan realista es el plan? Un worker de Celery repite el sprint miles de veces variando la duración de
        cada tarea alrededor de su estimación, respeta quién hace qué y qué tarea espera a cuál, y mide con qué
        probabilidad todo llega listo a la sprint review del viernes.</span>
    </app-encabezado>

    <section class="panel grid gap-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <label class="grid gap-1.5 text-sm">
        <span class="flex justify-between"><span class="font-medium text-forest">Incertidumbre σ</span><span class="font-mono text-moss">{{ p().variabilidad.toFixed(2) }}</span></span>
        <input type="range" min="0.05" max="0.6" step="0.05" [value]="p().variabilidad" (input)="cambiar('variabilidad', $event)" class="accent-[#04202C]" />
        <span class="text-xs text-tenue">{{ textoSigma() }}</span>
      </label>
      <label class="grid gap-1.5 text-sm">
        <span class="flex justify-between"><span class="font-medium text-forest">Horas productivas por día</span><span class="font-mono text-moss">{{ p().capacidad_horas_dia }} h</span></span>
        <input type="range" min="4" max="8" step="0.5" [value]="p().capacidad_horas_dia" (input)="cambiar('capacidad_horas_dia', $event)" class="accent-[#04202C]" />
        <span class="text-xs text-tenue">Lunes y viernes, 2 h menos por los eventos</span>
      </label>
      <label class="grid gap-1.5 text-sm">
        <span class="flex justify-between"><span class="font-medium text-forest">Iteraciones</span><span class="font-mono text-moss">{{ p().iteraciones }}</span></span>
        <input type="range" min="500" max="5000" step="500" [value]="p().iteraciones" (input)="cambiar('iteraciones', $event)" class="accent-[#04202C]" />
        <span class="text-xs text-tenue">Sprints simulados</span>
      </label>
      <button type="button" class="boton !py-3" (click)="simular()" [disabled]="corriendo()">
        @if (corriendo()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span> Simulando… }
        @else { <app-icono nombre="reproducir" clase="h-4 w-4" /> Simular }
      </button>
    </section>
    @if (error()) { <p class="mt-3 rounded-lg bg-mal-suave px-4 py-2 text-sm text-mal" role="alert">{{ error() }}</p> }

    @if (res(); as s) {
      @if (s.resultado; as x) {
        <p class="mt-4 font-mono text-[11px] text-moss" aria-live="polite">
          {{ esUltima() ? 'Última simulación guardada' : 'Simulación nueva' }} · σ {{ x.parametros.variabilidad }} · {{ x.parametros.capacidad_horas_dia }} h/día ·
          {{ x.parametros.iteraciones }} sprints · {{ x.duracion_ms }} ms en el worker</p>
        <section #kpis class="stagger-children mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <app-kpi etiqueta="Llega a la review" [valor]="pct(x.prob_a_tiempo)" detalle="con las 3 historias terminadas" icono="diana" />
          <app-kpi etiqueta="Término típico" [valor]="dia(x.termino.p50)" [detalle]="'P90: ' + dia(x.termino.p90)" icono="reloj" />
          <app-kpi etiqueta="Puntos esperados" [valor]="x.puntos.esperados + ' / ' + x.puntos.comprometidos" detalle="promedio de puntos terminados" icono="pila" />
          <app-kpi etiqueta="Persona crítica" [valor]="x.persona_critica.split(' ')[0]" detalle="menor probabilidad de acabar lo suyo" icono="alerta" />
        </section>

        <div class="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section class="panel"><h2 class="seccion">Burndown: plan frente a 8 de cada 10 sprints simulados (P10–P90)</h2><app-burndown [datos]="x.burndown" /></section>
          <section class="panel">
            <h2 class="seccion">¿Cuándo se termina?</h2>
            <div class="flex h-48 items-end gap-1" role="img" [attr.aria-label]="'Distribución del momento de término; ' + pct(x.prob_a_tiempo) + ' antes de la review'">
              @for (b of x.histograma; track b.etiqueta; let i = $index) {
                <div class="group relative flex h-full flex-1 flex-col justify-end">
                  <div class="barra-crece rounded-t-[4px] transition-all duration-700" [style.animation-delay.ms]="i * 50" [style.height.%]="(b.proporcion / maxHist()) * 100"
                       [style.background]="i === 10 ? '#DC2626' : '#2A78A8'" [style.min-height.px]="b.n ? 2 : 0"></div>
                  <span class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-forest px-2 py-1 font-mono text-[10px] text-white group-hover:block">{{ b.etiqueta }} · {{ pct(b.proporcion) }}</span>
                </div>
              }
            </div>
            <div class="mt-1 flex gap-1 font-mono text-[9px] text-moss">
              @for (b of x.histograma; track b.etiqueta; let i = $index) { <span class="flex-1 text-center">{{ i % 2 === 0 && i < 10 ? b.etiqueta.split(' ')[0] : i === 10 ? '+' : '' }}</span> }
            </div>
            <p class="mt-3 text-xs text-tenue">Medios días de término. En rojo, los sprints que no alcanzan a terminar antes del cierre del viernes ({{ pct(x.histograma[10].proporcion) }}).</p>
          </section>
        </div>

        <h2 class="seccion mt-8">Cada bolita es un sprint simulado</h2>
        <div appRevelar><app-figura carpeta="anatomia-galton" titulo="Tablero de Galton del sprint" alto="48rem" [mensaje]="mensajeGalton()"
             pie="Las bolitas caen con la incertidumbre de cada tarea y se apilan en el día en que termina el sprint" /></div>

        <h2 class="seccion mt-8">Por persona</h2>
        <section class="panel !p-0 overflow-x-auto">
          <table class="tabla min-w-[40rem]">
            <thead><tr><th>Persona</th><th class="text-right">Horas</th><th>Ocupación</th><th class="text-right">Termina (mediana)</th><th class="text-right">P90</th><th class="text-right">A tiempo</th></tr></thead>
            <tbody>
              @for (c of x.carga; track c.integrante_id) {
                <tr [class.bg-aviso-suave]="c.nombre === x.persona_critica">
                  <td class="whitespace-nowrap"><span class="mr-2 inline-block h-2.5 w-2.5 rounded-full" [style.background]="color(c.integrante_id)"></span>{{ c.nombre }}</td>
                  <td class="text-right font-mono">{{ c.horas_estimadas }}</td>
                  <td><div class="h-2 w-28 overflow-hidden rounded-full bg-fog/60"><div class="h-full rounded-full" [style.width.%]="c.ocupacion * 100" [style.background]="color(c.integrante_id)"></div></div>
                    <span class="font-mono text-[10px] text-moss">{{ pct(c.ocupacion) }} de {{ c.capacidad_sprint }} h</span></td>
                  <td class="text-right font-mono">{{ dia(c.termino_p50_dia) }}</td>
                  <td class="text-right font-mono">{{ dia(c.termino_p90_dia) }}</td>
                  <td class="text-right font-mono font-semibold">{{ pct(c.prob_a_tiempo) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <div class="mt-6 grid gap-6 md:grid-cols-2">
          <section class="panel">
            <h2 class="seccion">Por historia</h2>
            <ul class="grid gap-3">
              @for (h of x.historias; track h.id) {
                <li><div class="mb-1 flex justify-between text-sm"><span class="font-mono text-forest">{{ h.id }} · {{ h.puntos }} pts</span><span class="font-mono text-moss">{{ pct(h.prob_terminada) }}</span></div>
                  <div class="h-2 overflow-hidden rounded-full bg-fog/60"><div class="h-full rounded-full bg-forest transition-all duration-700" [style.width.%]="h.prob_terminada * 100"></div></div></li>
              }
            </ul>
          </section>
          <section class="panel">
            <h2 class="seccion">Qué dice la simulación</h2>
            <ul class="grid gap-2 text-sm leading-relaxed text-evergreen">
              <li class="flex gap-2"><app-icono nombre="check" clase="mt-0.5 h-4 w-4 text-bien" />Si todo dura lo estimado, el plan termina {{ dia(x.termino_plan_dia) }}: cabe en la semana.</li>
              <li class="flex gap-2"><app-icono nombre="alerta" clase="mt-0.5 h-4 w-4 text-aviso" />{{ x.persona_critica }} cierra la cadena: sus tareas esperan a las de los demás, así que absorbe sus retrasos.</li>
              <li class="flex gap-2"><app-icono nombre="foco" clase="mt-0.5 h-4 w-4 text-forest" />Probar cada historia en cuanto está lista (como propone Cesar en su reflexión) y publicar los contratos de la API el lunes (Mauricio) son justo las medidas que acortan esa cadena.</li>
            </ul>
          </section>
        </div>
      } @else if (s.estado === 'error') {
        <p class="panel mt-6 text-mal">{{ s.error }}</p>
      }
    } @else if (ultima.isLoading()) {
      <div class="mt-6 h-40 animate-pulse rounded-xl bg-borde/60"></div>
    } @else {
      <p class="panel mt-6 text-sm text-tenue">Todavía no hay simulaciones: elige los parámetros y pulsa «Simular».</p>
    }

    <details class="panel mt-8 text-sm text-evergreen">
      <summary class="cursor-pointer font-medium text-forest">Cómo funciona el modelo</summary>
      <ul class="mt-3 grid list-disc gap-1.5 pl-5 leading-relaxed">
        <li>Cada tarea dura <code>horas estimadas × LogNormal(0, σ)</code>: la estimación es la mediana y los retrasos pesan más que los adelantos.</li>
        <li>Cada persona hace sus tareas una tras otra, en el orden del plan; una tarea no empieza hasta que terminan las que necesita (p. ej. la prueba de punta a punta espera a la API y al flujo de reserva).</li>
        <li>Lunes y viernes ofrecen 2 h menos por el planning, la review y la retrospectiva. La validación con la clínica ocurre dentro de la review.</li>
        <li>El trabajo pesado corre en un worker de Celery con Redis como cola; el resultado queda guardado en Supabase y la página consulta su estado.</li>
      </ul>
      <div class="mt-4"><app-diagrama id="secuencia-simulacion" /></div>
    </details>
  `,
})
export class SimulacionPagina {
  private readonly http = inject(HttpClient);
  private readonly confeti = inject(Confeti);
  private readonly kpis = viewChild<ElementRef<HTMLElement>>('kpis');
  /** Lo que se le manda a la figura de Galton para que sus bolitas formen el histograma real. */
  protected readonly mensajeGalton = computed(() => {
    const x = this.res()?.resultado;
    return x ? { tipo: 'simulacion', histograma: x.histograma, prob_a_tiempo: x.prob_a_tiempo, parametros: x.parametros } : null;
  });
  private temporizador: ReturnType<typeof setTimeout> | undefined;
  protected readonly ultima = httpResource<Simulacion>(() => '/api/simulacion/ultima');
  protected readonly nueva = signal<Simulacion | null>(null);
  protected readonly res = computed(() => this.nueva() ?? (this.ultima.hasValue() ? this.ultima.value() : null));
  protected readonly esUltima = computed(() => !this.nueva());
  protected readonly corriendo = signal(false);
  protected readonly error = signal('');
  protected readonly p = signal<ParametrosSimulacion>({ iteraciones: 2000, variabilidad: 0.25, capacidad_horas_dia: 6 });
  protected readonly maxHist = computed(() => Math.max(...(this.res()?.resultado?.histograma ?? []).map((b) => b.proporcion), 0.01));
  protected readonly textoSigma = computed(() => {
    const s = this.p().variabilidad;
    return s <= 0.15 ? 'Equipo con experiencia en tareas parecidas' : s <= 0.3 ? 'Incertidumbre típica de un primer sprint' : 'Mucho por descubrir: tecnología o dominio nuevos';
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
  }

  protected cambiar(k: keyof ParametrosSimulacion, e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    this.p.update((p) => ({ ...p, [k]: v }));
  }

  protected simular() {
    this.corriendo.set(true);
    this.error.set('');
    this.http.post<{ id: string }>('/api/simulacion', this.p()).subscribe({
      next: ({ id }) => this.sondear(id, Date.now()),
      error: (e) => {
        this.corriendo.set(false);
        this.error.set(e?.status === 429 ? 'Demasiadas simulaciones seguidas: espera un minuto.' : 'No se pudo encolar la simulación.');
      },
    });
  }

  private sondear(id: string, inicio: number) {
    this.http.get<Simulacion>(`/api/simulacion/${id}`).subscribe({
      next: (s) => {
        if (s.estado === 'pendiente' && Date.now() - inicio < 60000) {
          this.temporizador = setTimeout(() => this.sondear(id, inicio), 600);
          return;
        }
        this.corriendo.set(false);
        if (s.estado === 'completada') {
          this.nueva.set(s);
          // Celebración solo si es más probable llegar a la review que no
          if ((s.resultado?.prob_a_tiempo ?? 0) >= 0.5) setTimeout(() => this.confeti.desde(this.kpis()?.nativeElement, 120), 300);
        }
        else this.error.set(s.error ?? 'La simulación tardó demasiado; inténtalo de nuevo.');
      },
      error: () => { this.corriendo.set(false); this.error.set('Se perdió la conexión con el servidor.'); },
    });
  }

  protected pct(x: number) {
    return `${Math.round(x * 100)} %`;
  }
  /** 4.75 → «Vie 75 %»; >5 → «después del viernes». */
  protected dia(d: number) {
    if (d > 5.0001) return 'después del viernes';
    const k = Math.min(Math.ceil(d) - 1, 4);
    const frac = d - k;
    return frac >= 0.999 ? `${DIA[k]} (cierre)` : `${DIA[Math.max(k, 0)]} · ${Math.round(frac * 100)} % del día`;
  }
  protected color(id: number) {
    return COLOR_PERSONA[id];
  }
}
