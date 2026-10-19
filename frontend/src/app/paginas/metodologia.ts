import { Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Encabezado } from '../componentes/encabezado';
import { Figura } from '../componentes/figura';
import { Icono } from '../componentes/icono';
import { Entregables } from '../core/modelos';

interface Diagrama { id: string; titulo: string; descripcion: string; svg: string; png: string; html: string }

@Component({
  selector: 'app-metodologia',
  imports: [Encabezado, Figura, Icono],
  template: `
    <app-encabezado titulo="Metodología: cómo se construyó" icono="capas" etiqueta="Desarrollo guiado por especificaciones · BMAD">
      <span entrada>Hay dos capas de Scrum. La primera es la actividad: el sprint de AgendaFácil se <strong>planea</strong>, no se ejecuta.
        La segunda es este portal, que sí se construyó con desarrollo guiado por especificaciones (GitHub spec-kit) y el método BMAD
        de planeación ágil, con figuras isométricas interactivas y diagramas propios.</span>
    </app-encabezado>

    <!-- Flujo -->
    <section class="panel overflow-x-auto">
      <ol class="flex min-w-[46rem] items-stretch gap-2">
        @for (p of flujo; track p.titulo; let i = $index) {
          <li class="flex flex-1 items-center gap-2">
            <div class="flex-1 rounded-xl border p-3" [class]="p.capa === 'bmad' ? 'border-[#2A78A8]/40 bg-[#2A78A8]/5' : p.capa === 'spec' ? 'border-forest/30 bg-acento-suave' : 'border-fog bg-white'">
              <p class="font-mono text-[10px] uppercase tracking-wider text-moss">{{ p.herramienta }}</p>
              <p class="mt-1 text-sm font-medium text-forest">{{ p.titulo }}</p>
            </div>
            @if (i < flujo.length - 1) { <app-icono nombre="flecha" clase="h-4 w-4 shrink-0 text-moss" /> }
          </li>
        }
      </ol>
    </section>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <section class="panel">
        <h2 class="seccion flex items-center gap-2"><app-icono nombre="archivo" clase="h-4 w-4" /> spec-kit · desarrollo guiado por especificaciones</h2>
        <p class="mb-3 text-sm text-tenue">La especificación es la fuente: constitución → spec → plan → tareas → implementación. Las mismas rutas viven en el repositorio.</p>
        <ul class="grid gap-1">
          @for (a of archivos('spec-kit'); track a.ruta) {
            <li><a [href]="url(a.ruta)" target="_blank" rel="noopener" class="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-acento-suave">
              <app-icono nombre="archivo" clase="h-4 w-4 text-pine" /><span class="flex-1 text-sm text-forest">{{ a.nombre }}</span>
              <span class="font-mono text-[10px] text-moss">{{ a.detalle }}</span></a></li>
          } @empty { <li class="text-sm text-tenue">Cargando…</li> }
        </ul>
      </section>
      <section class="panel">
        <h2 class="seccion flex items-center gap-2"><app-icono nombre="equipo" clase="h-4 w-4" /> Método BMAD · planeación y entrega</h2>
        <p class="mb-3 text-sm text-tenue">Con el método BMAD se elaboraron el brief, el PRD, la arquitectura y las épicas; el estado del sprint del portal queda en <code>sprint-status.yaml</code>.</p>
        <ul class="grid gap-1">
          @for (a of archivos('BMAD'); track a.ruta) {
            <li><a [href]="url(a.ruta)" target="_blank" rel="noopener" class="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-acento-suave">
              <app-icono nombre="archivo" clase="h-4 w-4 text-[#2A78A8]" /><span class="flex-1 text-sm text-forest">{{ a.nombre }}</span>
              <span class="font-mono text-[10px] text-moss">{{ a.detalle }}</span></a></li>
          } @empty { <li class="text-sm text-tenue">Cargando…</li> }
        </ul>
      </section>
    </div>

    <!-- Figuras isométricas -->
    <h2 class="seccion mt-8">Figuras isométricas interactivas</h2>
    <div class="mb-3 flex flex-wrap gap-1 rounded-xl border border-fog bg-white p-1" role="tablist" aria-label="Figuras isométricas">
      @for (f of figuras; track f.carpeta) {
        <button type="button" role="tab" [attr.aria-selected]="figura() === f.carpeta" (click)="figura.set(f.carpeta)"
                class="flex-1 rounded-lg px-3 py-2 text-sm transition" [class]="figura() === f.carpeta ? 'bg-forest text-white shadow' : 'text-evergreen hover:bg-acento-suave'">{{ f.titulo }}</button>
      }
    </div>
    @for (f of figuras; track f.carpeta) {
      @if (figura() === f.carpeta) {
        <div class="animate-fadeIn"><app-figura [carpeta]="f.carpeta" [titulo]="f.titulo" [pie]="f.pie" alto="46rem" /></div>
      }
    }

    <!-- Diagramas -->
    <h2 class="seccion mt-8">Diagramas</h2>
    <section class="stagger-children grid gap-4 md:grid-cols-2">
      @for (d of diagramas.value() ?? []; track d.id) {
        <article class="panel group !p-2">
          <button type="button" class="block w-full overflow-hidden rounded-lg bg-[#F7F8F7]" (click)="abierto.set(d)" [attr.aria-label]="'Ampliar ' + d.titulo">
            <img [src]="'/figuras/diagramas/' + d.png" [alt]="d.titulo" loading="lazy" class="aspect-[16/10] w-full object-contain transition duration-500 group-hover:scale-[1.02]" /></button>
          <div class="px-2 pb-2 pt-3">
            <h3 class="font-display font-semibold text-forest">{{ d.titulo }}</h3>
            <p class="mt-1 text-xs leading-relaxed text-tenue">{{ d.descripcion }}</p>
            <p class="mt-2 flex gap-3 font-mono text-[11px]">
              <a [href]="'/figuras/diagramas/' + d.svg" target="_blank" rel="noopener" class="text-forest underline underline-offset-2">SVG</a>
              <a [href]="'/figuras/diagramas/' + d.png" target="_blank" rel="noopener" class="text-forest underline underline-offset-2">PNG</a>
              <a [href]="'/figuras/diagramas/' + d.html" target="_blank" rel="noopener" class="text-forest underline underline-offset-2">HTML</a></p>
          </div>
        </article>
      }
    </section>

    @if (abierto(); as d) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-forest/70 p-4 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true" [attr.aria-label]="d.titulo" (click)="abierto.set(null)" (keydown.escape)="abierto.set(null)" tabindex="-1">
        <figure class="max-h-full max-w-6xl overflow-auto rounded-xl bg-white p-3" (click)="$event.stopPropagation()">
          <img [src]="'/figuras/diagramas/' + d.png" [alt]="d.titulo" class="w-full" />
          <figcaption class="flex items-center justify-between gap-4 px-2 pt-3"><span class="font-display font-semibold text-forest">{{ d.titulo }}</span>
            <button type="button" class="boton" (click)="abierto.set(null)">Cerrar</button></figcaption>
        </figure>
      </div>
    }

  `,
})
export class MetodologiaPagina {
  protected readonly e = httpResource<Entregables>(() => '/api/entregables');
  protected readonly diagramas = httpResource<Diagrama[]>(() => '/figuras/diagramas/indice.json');
  protected readonly abierto = signal<Diagrama | null>(null);
  protected readonly figura = signal('anatomia');
  protected readonly figuras = [
    { carpeta: 'anatomia', titulo: 'El sprint', pie: 'El sprint de una semana como línea de montaje' },
    { carpeta: 'anatomia-backlog', titulo: 'El backlog', pie: 'Priorizar, estimar y seleccionar lo que entra al sprint' },
    { carpeta: 'anatomia-galton', titulo: 'La simulación', pie: 'Monte Carlo del sprint como tablero de Galton' },
  ];
  protected readonly flujo: { titulo: string; herramienta: string; capa: 'spec' | 'bmad' | 'codigo' }[] = [
    { titulo: 'Brief y PRD', herramienta: 'BMAD', capa: 'bmad' },
    { titulo: 'Constitución', herramienta: 'spec-kit', capa: 'spec' },
    { titulo: 'Spec', herramienta: 'spec-kit', capa: 'spec' },
    { titulo: 'Arquitectura', herramienta: 'BMAD', capa: 'bmad' },
    { titulo: 'Plan y contratos', herramienta: 'spec-kit', capa: 'spec' },
    { titulo: 'Épicas y tareas', herramienta: 'BMAD + spec-kit', capa: 'bmad' },
    { titulo: 'Código y despliegue', herramienta: 'Angular · FastAPI · Swarm', capa: 'codigo' },
  ];
  protected archivos(criterio: string) {
    return (this.e.value()?.archivos ?? []).filter((a) => a.criterio === criterio);
  }
  protected url(ruta: string) {
    return `/api/entregables/archivo?ver=1&ruta=${encodeURIComponent(ruta)}`;
  }
}
