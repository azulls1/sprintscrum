import { Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Icono, NombreIcono } from '../componentes/icono';
import { Revelar } from '../componentes/revelar';
import { Conclusion } from '../core/modelos';

@Component({
  selector: 'app-conclusion',
  imports: [Encabezado, Estado, Icono, Revelar],
  template: `
    <app-encabezado titulo="Conclusión grupal" icono="foco" etiqueta="Criterio 5 · 20 %">
      <span entrada>¿Qué aprendimos como equipo sobre Scrum y el trabajo colaborativo? Máximo 200 palabras.</span>
      @if (r.value(); as c) {
        <span class="rounded-full px-3 py-1 font-mono text-xs" [class]="c.palabras <= 200 ? 'bg-bien-suave text-bien' : 'bg-mal-suave text-mal'">{{ c.palabras }} / 200 palabras</span>
      }
    </app-encabezado>

    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.hasValue()" (reintentar)="r.reload()">
      @if (r.value(); as c) {
        <section class="card-hero !p-6 !text-left sm:!p-10">
          <div class="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#5B7065]/25 blur-3xl orbe" aria-hidden="true"></div>
          <blockquote class="relative">
            <p class="font-display text-xl leading-relaxed text-white sm:text-2xl">“{{ primera() }}”</p>
            <p class="mt-6 max-w-3xl text-[15px] leading-[1.8] text-white/80">{{ resto() }}</p>
            <footer class="mt-6 font-mono text-xs text-white/50">— {{ c.equipo }}</footer>
          </blockquote>
        </section>

        <h2 class="seccion mt-8">Los aprendizajes, uno por uno</h2>
        <section class="stagger-children grid gap-4 md:grid-cols-2">
          @for (a of aprendizajes; track a.titulo) {
            <article class="panel group flex gap-4" appRevelar>
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-white transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110"><app-icono [nombre]="a.icono" /></span>
              <div><h3 class="font-display font-semibold text-forest">{{ a.titulo }}</h3><p class="mt-1 text-sm leading-relaxed text-tenue">{{ a.texto }}</p></div>
            </article>
          }
        </section>
      }
    </app-estado>
  `,
})
export class ConclusionPagina {
  protected readonly r = httpResource<Conclusion>(() => '/api/conclusion');
  protected readonly primera = computed(() => (this.r.value()?.texto ?? '').split(/(?<=\.)\s+/)[0]);
  protected readonly resto = computed(() => (this.r.value()?.texto ?? '').split(/(?<=\.)\s+/).slice(1).join(' '));
  protected readonly aprendizajes: { titulo: string; texto: string; icono: NombreIcono }[] = [
    { titulo: 'Comprometerse con menos y terminarlo', icono: 'diana', texto: 'Los recordatorios por WhatsApp y el panel de recepción quedaron fuera: al estimar y compararlo con una semana, el sprint backlog tenía que ser realista.' },
    { titulo: 'Priorizar por valor', icono: 'pila', texto: 'Sin reservar una cita, nada de lo demás sirve: por eso las tres historias de prioridad alta forman el sprint.' },
    { titulo: 'Desglosar deja ver los riesgos', icono: 'alerta', texto: 'La carga del backend era la más alta; de ahí el acuerdo de publicar los contratos de la API el primer día.' },
    { titulo: 'Roles claros, menos fricción', icono: 'equipo', texto: 'Qué decide el product owner, qué protege el Scrum master y qué se autoorganiza entre los desarrolladores.' },
    { titulo: 'La transparencia hace mejorar', icono: 'tablero', texto: 'Un tablero visible, dailies cortas y una retrospectiva honesta: así mejora un equipo pequeño sprint a sprint.' },
  ];
}
