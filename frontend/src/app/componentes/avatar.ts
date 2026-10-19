import { Component, computed, input } from '@angular/core';
import { COLOR_PERSONA } from '../core/modelos';

/** Iniciales sobre el color de la persona (el color siempre va con el nombre al lado: nunca solo). */
@Component({
  selector: 'app-avatar',
  template: `<span class="inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white"
                   [class]="tam() === 'lg' ? 'h-12 w-12 text-base' : 'h-7 w-7 text-[11px]'" [style.background]="color()" aria-hidden="true">{{ iniciales() }}</span>`,
  host: { class: 'inline-flex' },
})
export class Avatar {
  readonly id = input.required<number>();
  readonly nombre = input.required<string>();
  readonly tam = input<'sm' | 'lg'>('sm');
  protected readonly color = computed(() => COLOR_PERSONA[this.id()] ?? '#5B7065');
  protected readonly iniciales = computed(() => this.nombre().split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join(''));
}
