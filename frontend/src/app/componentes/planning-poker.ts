import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { COLOR_PERSONA, Historia } from '../core/modelos';
import { Avatar } from './avatar';
import { Confeti } from './confeti';
import { Icono } from './icono';

const BARAJA = [1, 2, 3, 5, 8, 13];

/** Por qué el equipo estimó así cada historia (ampliación didáctica del portal). */
const RAZON: Record<string, string> = {
  'HU-01': 'Formulario y API sencillos; lo único delicado es validar teléfono y correo.',
  'HU-02': 'Hay que modelar horarios por dentista y mostrar un calendario que no se sature.',
  'HU-03': 'Impedir la doble reserva y enviar el correo la vuelven la más compleja del sprint.',
  'HU-04': 'Es un panel de lectura sobre datos que ya existirán después del sprint 1.',
  'HU-05': 'Integrar WhatsApp es terreno desconocido para el equipo: más incertidumbre.',
  'HU-06': 'Un enlace seguro de un solo uso que además libere el horario.',
  'HU-07': 'Una consulta agregada y una exportación mensual.',
  'HU-08': 'Un asistente conversacional es muy incierto: conviene dividirlo antes de comprometerlo.',
};

/** Los tres desarrolladores votan (el product owner no vota: aclara dudas). */
const VOTANTES = [
  { id: 3, nombre: 'Mauricio' },
  { id: 4, nombre: 'Diego' },
  { id: 2, nombre: 'Cesar' },
];

@Component({
  selector: 'app-planning-poker',
  imports: [Avatar, Icono],
  template: `
    <section #raiz class="panel overflow-hidden">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-forest">Planning poker · ¿estimas como el equipo?</h2>
          <p class="text-sm text-tenue">Elige una carta para la historia. Los tres desarrolladores votan a la vez y luego se revelan.
            El product owner no vota: responde dudas.</p>
        </div>
        <div class="flex items-center gap-4 font-mono text-xs text-moss">
          <span>Ronda <span class="text-forest">{{ ronda() + 1 }}/{{ historias().length }}</span></span>
          <span class="rounded-full bg-forest px-3 py-1 text-white tabular-nums">{{ puntaje() }} pts</span>
        </div>
      </header>

      @if (actual(); as h) {
        @if (!terminado()) {
          <div class="mt-5 rounded-xl border border-fog bg-acento-suave/50 p-4 animate-fadeIn">
            <p class="font-mono text-xs font-semibold text-forest">{{ h.id }} · prioridad {{ h.prioridad.toLowerCase() }}</p>
            <p class="mt-1 text-[15px] leading-relaxed text-evergreen">{{ h.texto }}</p>
          </div>

          <!-- Mesa: los votos del equipo -->
          <div class="mt-5 grid grid-cols-4 gap-3 sm:gap-5">
            @for (v of votantes; track v.id; let i = $index) {
              <div class="flex flex-col items-center gap-2">
                <div class="carta h-24 w-16 sm:h-28 sm:w-20" [class.carta--volteada]="revelado()">
                  <div class="carta__cara relative h-full w-full" [style.transition-delay.ms]="i * 160">
                    <div class="carta__frente absolute inset-0 flex items-center justify-center rounded-xl border-2 border-white bg-forest shadow-lg">
                      <span class="font-display text-xl text-white/40">?</span></div>
                    <div class="carta__dorso absolute inset-0 flex items-center justify-center rounded-xl border-2 bg-white shadow-lg" [style.border-color]="color(v.id)">
                      <span class="font-display text-3xl font-semibold text-forest">{{ votos()[i] }}</span></div>
                  </div>
                </div>
                <span class="flex items-center gap-1.5 text-xs text-tenue"><app-avatar [id]="v.id" [nombre]="v.nombre" /> {{ v.nombre }}</span>
              </div>
            }
            <div class="flex flex-col items-center gap-2">
              <div class="carta h-24 w-16 sm:h-28 sm:w-20" [class.carta--volteada]="eleccion() !== null">
                <div class="carta__cara relative h-full w-full">
                  <div class="carta__frente absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-moss/50 bg-white">
                    <span class="px-1 text-center text-[10px] text-moss">tu carta</span></div>
                  <div class="carta__dorso absolute inset-0 flex items-center justify-center rounded-xl border-2 border-forest bg-forest shadow-lg">
                    <span class="font-display text-3xl font-semibold text-white">{{ eleccion() }}</span></div>
                </div>
              </div>
              <span class="text-xs font-medium text-forest">Tú</span>
            </div>
          </div>

          <!-- Tu mano -->
          @if (!revelado()) {
            <div class="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Elige tu estimación en puntos">
              @for (c of baraja; track c) {
                <button type="button" class="carta-elegible flex h-16 w-12 items-center justify-center rounded-lg border-2 border-forest bg-white font-display text-lg font-semibold text-forest"
                        (click)="elegir(c)" [attr.aria-label]="c + ' puntos'">{{ c }}</button>
              }
            </div>
          } @else {
            <div class="mt-6 rounded-xl p-4 animate-fadeInUp" [class]="acierto() === 2 ? 'bg-bien-suave' : acierto() === 1 ? 'bg-aviso-suave' : 'bg-acento-suave'">
              <p class="font-display font-semibold" [class]="acierto() === 2 ? 'text-bien' : acierto() === 1 ? 'text-aviso' : 'text-forest'">
                {{ acierto() === 2 ? '¡Igual que el equipo! +2' : acierto() === 1 ? 'Muy cerca: a una carta de distancia. +1' : 'El equipo estimó distinto' }}
                <span class="font-normal text-tenue"> · estimación acordada: {{ h.puntos }} puntos</span></p>
              <p class="mt-1 text-sm leading-relaxed text-evergreen">{{ razon(h.id) }}</p>
              @if (hayDiscrepancia()) {
                <p class="mt-1 text-xs text-tenue">Hubo una carta distinta en la mesa: en planning poker quien votó más alto y más bajo explican su razonamiento y se vuelve a votar hasta converger.</p>
              }
              <button type="button" class="boton mt-3" (click)="siguiente()">{{ ronda() + 1 < historias().length ? 'Siguiente historia' : 'Ver resultado' }}
                <app-icono nombre="flecha" clase="h-4 w-4" /></button>
            </div>
          }
        } @else {
          <div class="mt-6 rounded-xl bg-forest p-6 text-center text-white animate-scaleIn">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-white/60">Resultado</p>
            <p class="mt-2 font-display text-4xl font-semibold">{{ puntaje() }} / {{ historias().length * 2 }}</p>
            <p class="mt-2 text-sm text-white/75">{{ veredicto() }}</p>
            @if (mejor() > 0) { <p class="mt-1 font-mono text-[11px] text-white/50">Tu mejor marca en este navegador: {{ mejor() }}</p> }
            <button type="button" class="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-forest" (click)="reiniciar()">
              <app-icono nombre="reiniciar" clase="h-4 w-4" /> Jugar otra vez</button>
          </div>
        }
      }
    </section>
  `,
})
export class PlanningPoker {
  readonly historias = input.required<Historia[]>();
  private readonly confeti = inject(Confeti);
  private readonly raiz = viewChild<ElementRef<HTMLElement>>('raiz');
  protected readonly baraja = BARAJA;
  protected readonly votantes = VOTANTES;
  protected readonly ronda = signal(0);
  protected readonly eleccion = signal<number | null>(null);
  protected readonly revelado = signal(false);
  protected readonly puntaje = signal(0);
  protected readonly terminado = signal(false);
  protected readonly mejor = signal(this.leerMejor());
  protected readonly actual = computed(() => this.historias()[this.ronda()]);

  /** Votos de la mesa: dos coinciden con la estimación acordada; uno queda a una carta (cambia por historia). */
  protected readonly votos = computed(() => {
    const h = this.actual();
    if (!h) return [0, 0, 0];
    const i = BARAJA.indexOf(h.puntos);
    const raro = this.ronda() % 3;
    const desvio = h.orden % 2 === 0 ? Math.min(i + 1, BARAJA.length - 1) : Math.max(i - 1, 0);
    return VOTANTES.map((_, k) => (k === raro && h.orden % 4 !== 1 ? BARAJA[desvio] : h.puntos));
  });
  protected readonly hayDiscrepancia = computed(() => new Set(this.votos()).size > 1);
  /** 2 = igual; 1 = a una carta; 0 = más lejos. */
  protected readonly acierto = computed(() => {
    const h = this.actual();
    const e = this.eleccion();
    if (!h || e === null) return 0;
    const d = Math.abs(BARAJA.indexOf(e) - BARAJA.indexOf(h.puntos));
    return d === 0 ? 2 : d === 1 ? 1 : 0;
  });
  protected readonly veredicto = computed(() => {
    const r = this.puntaje() / (this.historias().length * 2);
    return r >= 0.8 ? 'Estimas como un miembro más del equipo.' : r >= 0.5 ? 'Buen ojo: con una ronda de discusión convergerías.'
      : 'Las estimaciones son relativas: compara cada historia con HU-01 (3 puntos) como referencia.';
  });

  protected elegir(c: number) {
    this.eleccion.set(c);
    setTimeout(() => {
      this.revelado.set(true);
      this.puntaje.update((p) => p + this.acierto());
      if (this.acierto() === 2) setTimeout(() => this.confeti.desde(this.raiz()?.nativeElement, 90), 650);
    }, 450);
  }
  protected siguiente() {
    if (this.ronda() + 1 >= this.historias().length) {
      this.terminado.set(true);
      if (this.puntaje() > this.mejor()) this.guardarMejor(this.puntaje());
      if (this.puntaje() >= this.historias().length) this.confeti.desde(this.raiz()?.nativeElement, 180);
      return;
    }
    this.revelado.set(false);
    this.eleccion.set(null);
    this.ronda.update((r) => r + 1);
  }
  protected reiniciar() {
    this.ronda.set(0); this.eleccion.set(null); this.revelado.set(false); this.puntaje.set(0); this.terminado.set(false);
  }
  protected razon(id: string) {
    return RAZON[id] ?? '';
  }
  protected color(id: number) {
    return COLOR_PERSONA[id];
  }
  private leerMejor(): number {
    try { return Number(localStorage.getItem('sprintscrum:poker-mejor') ?? 0) || 0; } catch { return 0; }
  }
  private guardarMejor(n: number) {
    this.mejor.set(n);
    try { localStorage.setItem('sprintscrum:poker-mejor', String(n)); } catch { /* sin almacenamiento */ }
  }
}
