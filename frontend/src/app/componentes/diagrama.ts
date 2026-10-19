import { Component, computed, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Icono } from './icono';

export interface Diagrama { id: string; titulo: string; descripcion: string; svg: string; png: string; html: string }

/** Un diagrama del proyecto (por id de /figuras/diagramas/indice.json) con ampliación al hacer clic. */
@Component({
  selector: 'app-diagrama',
  imports: [Icono],
  template: `
    @if (d(); as x) {
      <figure class="panel group !p-2">
        <button type="button" class="block w-full cursor-zoom-in overflow-hidden rounded-lg bg-[#F7F8F7]" (click)="abierto.set(true)" [attr.aria-label]="'Ampliar ' + x.titulo">
          <img [src]="'/figuras/diagramas/' + x.png" [alt]="x.titulo" loading="lazy" class="w-full transition duration-700 group-hover:scale-[1.015]" /></button>
        <figcaption class="flex flex-wrap items-baseline justify-between gap-2 px-2 pb-1 pt-3">
          <span><span class="font-display font-semibold text-forest">{{ x.titulo }}</span>
            @if (conDescripcion()) { <span class="mt-0.5 block text-xs leading-relaxed text-tenue">{{ x.descripcion }}</span> }</span>
          <span class="flex gap-3 font-mono text-[11px]">
            <a [href]="'/figuras/diagramas/' + x.svg" target="_blank" rel="noopener" class="text-forest underline underline-offset-2">SVG</a>
            <a [href]="'/figuras/diagramas/' + x.html" target="_blank" rel="noopener" class="text-forest underline underline-offset-2">HTML</a></span>
        </figcaption>
      </figure>
      @if (abierto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-forest/70 p-4 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true"
             [attr.aria-label]="x.titulo" (click)="abierto.set(false)" (keydown.escape)="abierto.set(false)" tabindex="-1">
          <figure class="max-h-full max-w-6xl overflow-auto rounded-xl bg-white p-3 animate-scaleIn" (click)="$event.stopPropagation()">
            <img [src]="'/figuras/diagramas/' + x.png" [alt]="x.titulo" class="w-full" />
            <figcaption class="flex items-center justify-between gap-4 px-2 pt-3"><span class="font-display font-semibold text-forest">{{ x.titulo }}</span>
              <button type="button" class="boton" (click)="abierto.set(false)"><app-icono nombre="x" clase="h-4 w-4" /> Cerrar</button></figcaption>
          </figure>
        </div>
      }
    }
  `,
})
export class DiagramaFig {
  readonly id = input.required<string>();
  readonly conDescripcion = input(true);
  private readonly indice = httpResource<Diagrama[]>(() => '/figuras/diagramas/indice.json');
  protected readonly d = computed(() => this.indice.value()?.find((x) => x.id === this.id()));
  protected readonly abierto = signal(false);
}
