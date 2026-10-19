import { Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Avatar } from '../componentes/avatar';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Icono } from '../componentes/icono';
import { NOMBRE_ROL, Reflexion } from '../core/modelos';

/** Frases que responden a cada pregunta del enunciado, para resaltarlas en el texto. */
const PREGUNTAS = [
  { id: 'tareas', texto: '¿Qué tareas realizaría?', claves: /(me encargaré|construiré|facilitaré|cargaré|presentaré|diseñaré|ejecutaré|mi trabajo|mi tarea principal)/i },
  { id: 'retos', texto: '¿Qué retos anticipa?', claves: /(reto)/i },
  { id: 'contribucion', texto: '¿Cómo contribuiría al equipo?', claves: /(contribuiré|mi contribución)/i },
] as const;

@Component({
  selector: 'app-reflexiones',
  imports: [Avatar, Encabezado, Estado, Icono],
  template: `
    <app-encabezado titulo="Reflexiones individuales" icono="pluma" etiqueta="Criterio 4 · 20 %">
      <span entrada>Un párrafo de 150 a 200 palabras por integrante que responde tres preguntas: qué tareas haría en su rol,
        qué retos anticipa y cómo contribuiría al equipo. Activa una pregunta para resaltar dónde la responde cada uno.</span>
    </app-encabezado>

    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.value()?.length" (reintentar)="r.reload()">
      @if (r.value(); as rs) {
        <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Resaltar respuestas">
          @for (q of preguntas; track q.id) {
            <button type="button" (click)="resaltar.set(resaltar() === q.id ? null : q.id)" [attr.aria-pressed]="resaltar() === q.id"
                    class="rounded-full border px-3 py-1 text-xs transition"
                    [class]="resaltar() === q.id ? 'border-forest bg-forest text-white' : 'border-fog bg-white text-evergreen hover:border-forest'">{{ q.texto }}</button>
          }
        </div>

        <div class="flex flex-wrap gap-1 rounded-xl border border-fog bg-white p-1" role="tablist" aria-label="Integrantes">
          @for (x of rs; track x.integrante_id; let i = $index) {
            <button type="button" role="tab" [attr.aria-selected]="activa() === i" (click)="activa.set(i)"
                    class="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition"
                    [class]="activa() === i ? 'bg-forest text-white shadow' : 'text-evergreen hover:bg-acento-suave'">
              <app-avatar [id]="x.integrante_id" [nombre]="x.nombre" /> {{ x.nombre.split(' ')[0] }}</button>
          }
        </div>

        @if (rs[activa()]; as x) {
          <article class="panel mt-4 animate-fadeIn" role="tabpanel">
            <header class="mb-4 flex flex-wrap items-center gap-4">
              <app-avatar [id]="x.integrante_id" [nombre]="x.nombre" tam="lg" />
              <div class="min-w-0 flex-1"><h2 class="font-display text-xl font-semibold text-forest">{{ x.nombre }}</h2>
                <p class="text-sm text-tenue">{{ x.rol }} · {{ rol[x.rol_scrum] }}</p></div>
              <span class="rounded-full px-3 py-1 font-mono text-xs" [class]="x.palabras >= 150 && x.palabras <= 200 ? 'bg-bien-suave text-bien' : 'bg-mal-suave text-mal'">{{ x.palabras }} palabras · 150–200</span>
            </header>
            <p class="text-[16px] leading-[1.8] text-evergreen">
              @for (f of frases(x.texto); track $index) {
                <span [class]="f.marca ? 'rounded bg-[#2A78A8]/15 px-0.5 text-forest' : ''">{{ f.texto }} </span>
              }
            </p>
            <footer class="mt-5 flex flex-wrap gap-2 border-t border-fog/60 pt-4">
              @for (q of preguntas; track q.id) {
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs" [class]="responde(x.texto, q.id) ? 'bg-bien-suave text-bien' : 'bg-mal-suave text-mal'">
                  <app-icono [nombre]="responde(x.texto, q.id) ? 'check' : 'x'" clase="h-3.5 w-3.5" /> {{ q.texto }}</span>
              }
            </footer>
          </article>
        }

        <section class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          @for (x of rs; track x.integrante_id; let i = $index) {
            <button type="button" (click)="activa.set(i)" class="panel !p-4 text-left transition hover:-translate-y-0.5" [class.ring-2]="activa() === i" [class.ring-forest]="activa() === i">
              <p class="font-mono text-[10px] uppercase tracking-wider text-moss">{{ x.rol }}</p>
              <p class="mt-1 font-medium text-forest">{{ x.nombre.split(' ').slice(0, 2).join(' ') }}</p>
              <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-fog/60" [attr.aria-label]="x.palabras + ' palabras'" role="img">
                <div class="h-full rounded-full bg-forest" [style.width.%]="(x.palabras / 200) * 100"></div></div>
              <p class="mt-1 font-mono text-[11px] text-moss">{{ x.palabras }} / 200</p>
            </button>
          }
        </section>
        <p class="mt-3 text-xs text-tenue">Las reflexiones están redactadas en primera persona; cada integrante revisa y ajusta la suya antes de la entrega.</p>
      }
    </app-estado>
  `,
})
export class ReflexionesPagina {
  protected readonly r = httpResource<Reflexion[]>(() => '/api/reflexiones');
  protected readonly activa = signal(0);
  protected readonly resaltar = signal<string | null>(null);
  protected readonly preguntas = PREGUNTAS;
  protected readonly rol = NOMBRE_ROL;
  private readonly patron = computed(() => PREGUNTAS.find((q) => q.id === this.resaltar())?.claves ?? null);

  protected frases(t: string) {
    const p = this.patron();
    return t.split(/(?<=[.:])\s+/).map((texto) => ({ texto, marca: !!p && p.test(texto) }));
  }
  protected responde(t: string, id: string) {
    return PREGUNTAS.find((q) => q.id === id)!.claves.test(t);
  }
}
