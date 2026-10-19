import { Component, ElementRef, computed, effect, inject, input, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Icono } from './icono';

/**
 * Figura isométrica interactiva incrustada (iframe del mismo origen, servida desde /figuras/<carpeta>/).
 * Si recibe `mensaje`, se lo envía a la figura con postMessage (p. ej. el resultado real de la simulación).
 */
@Component({
  selector: 'app-figura',
  imports: [Icono],
  template: `
    <figure class="panel !p-0 overflow-hidden">
      <iframe #marco [src]="rutaSegura()" [title]="titulo()" loading="lazy" (load)="enviar()"
              class="block w-full border-0 bg-[#F7F8F7]" [style.height]="alto()"></iframe>
      <figcaption class="flex flex-wrap items-center justify-between gap-2 border-t border-fog/60 px-4 py-2.5 text-xs text-tenue">
        <span class="flex items-center gap-2"><app-icono nombre="cubo" clase="h-4 w-4 text-pine" />{{ pie() }}</span>
        <a [href]="ruta()" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-forest underline underline-offset-2">Pantalla completa <app-icono nombre="flecha" clase="h-3 w-3" /></a>
      </figcaption>
    </figure>
  `,
})
export class Figura {
  readonly carpeta = input.required<string>();
  readonly titulo = input.required<string>();
  readonly pie = input('Figura isométrica interactiva');
  readonly alto = input('44rem');
  readonly mensaje = input<unknown>(null);
  private readonly marco = viewChild<ElementRef<HTMLIFrameElement>>('marco');
  private readonly sanitizer = inject(DomSanitizer);
  /** Solo carpetas propias de /figuras/ (nombre en minúsculas y guiones): nunca una URL arbitraria. */
  protected readonly ruta = computed(() => {
    const c = this.carpeta();
    return /^[a-z][a-z-]*$/.test(c) ? `/figuras/${c}/index.html` : 'about:blank';
  });
  protected readonly rutaSegura = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.ruta()));

  constructor() {
    effect(() => { this.mensaje(); this.enviar(); });
  }
  protected enviar() {
    const m = this.mensaje();
    const w = this.marco()?.nativeElement.contentWindow;
    if (m && w) w.postMessage(m, location.origin);
  }
}
