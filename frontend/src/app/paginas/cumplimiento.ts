import { Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Icono } from '../componentes/icono';
import { Confeti } from '../componentes/confeti';
import { Kpi } from '../componentes/kpi';
import { Requisito } from '../core/modelos';

const NOMBRES: Record<string, string> = {
  C1: 'Criterio 1 · Descripción del proyecto', Roles: 'Asignación de roles Scrum', C2: 'Criterio 2 · Product backlog',
  C3: 'Criterio 3 · Sprint backlog', C4: 'Criterio 4 · Reflexión individual', C5: 'Criterio 5 · Conclusión grupal', Formato: 'Formato y extensión',
};

@Component({
  selector: 'app-cumplimiento',
  imports: [Encabezado, Estado, Icono, Kpi, RouterLink],
  template: `
    <app-encabezado titulo="Cumplimiento del enunciado" icono="escudo" etiqueta="Rúbrica · 5 criterios × 2 puntos">
      <span entrada>Cada requisito del enunciado y de la rúbrica, comprobado en el servidor contra los datos de la base y el
        .docx entregado: conteos de palabras, formato de las historias, tareas completas y estilo del documento. Nada se marca a mano.</span>
    </app-encabezado>

    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.value()?.length" (reintentar)="r.reload()">
      @if (r.value(); as rs) {
        <!-- Anillo de progreso que se llena -->
        <section #anillo class="panel mb-6 flex flex-wrap items-center gap-6">
          <svg viewBox="0 0 120 120" class="h-28 w-28 -rotate-90" role="img" [attr.aria-label]="cuenta('ok') + ' de ' + rs.length + ' requisitos cumplen'">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#DFE4E0" stroke-width="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#D97706" stroke-width="10" pathLength="100"
                    [attr.stroke-dasharray]="((cuenta('ok') + cuenta('aviso')) / rs.length) * 100 + ' 100'" class="animate-fadeIn" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#059669" stroke-width="10" stroke-linecap="round" pathLength="100"
                    [attr.stroke-dasharray]="(cuenta('ok') / rs.length) * 100 + ' 100'" class="anillo-llena" />
          </svg>
          <div class="min-w-0 flex-1">
            <p class="font-display text-3xl font-semibold text-forest tabular-nums">{{ cuenta('ok') }} <span class="text-lg text-moss">de {{ rs.length }}</span></p>
            <p class="text-sm text-tenue">requisitos cumplen sin observaciones{{ cuenta('aviso') ? ' · ' + cuenta('aviso') + ' con aviso' : '' }}{{ cuenta('mal') ? ' · ' + cuenta('mal') + ' no cumplen' : ' · ninguno bloquea la entrega' }}</p>
          </div>
        </section>
        <section class="stagger-children grid grid-cols-2 gap-3 md:grid-cols-4">
          <app-kpi etiqueta="Requisitos" [valor]="'' + rs.length" detalle="comprobados automáticamente" icono="escudo" />
          <app-kpi etiqueta="Cumplen" [valor]="'' + cuenta('ok')" detalle="sin observaciones" icono="checkCirculo" />
          <app-kpi etiqueta="Con aviso" [valor]="'' + cuenta('aviso')" detalle="revisar antes de entregar" icono="alerta" />
          <app-kpi etiqueta="No cumplen" [valor]="'' + cuenta('mal')" detalle="bloquean la entrega" icono="x" />
        </section>

        @for (g of grupos(); track g.id) {
          <h2 class="seccion mt-8">{{ nombre(g.id) }}</h2>
          <section class="panel !p-0 overflow-hidden">
            <ul class="divide-y divide-fog/60">
              @for (q of g.items; track q.id) {
                <li class="flex flex-wrap items-start gap-3 px-4 py-3" [class.bg-aviso-suave]="q.aviso">
                  <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        [class]="q.cumplido ? 'bg-bien-suave text-bien' : q.aviso ? 'bg-aviso/15 text-aviso' : 'bg-mal-suave text-mal'">
                    <app-icono [nombre]="q.cumplido ? 'check' : q.aviso ? 'alerta' : 'x'" clase="h-4 w-4" [grosor]="2.25" /></span>
                  <span class="min-w-0 flex-1">
                    <span class="flex flex-wrap items-baseline gap-2"><span class="font-mono text-[11px] text-moss">{{ q.id }}</span>
                      <span class="font-medium text-forest">{{ q.texto }}</span>
                      <span class="text-xs font-medium" [class]="q.cumplido ? 'text-bien' : q.aviso ? 'text-aviso' : 'text-mal'">{{ q.cumplido ? 'Cumple' : q.aviso ? 'Aviso' : 'No cumple' }}</span></span>
                    <span class="mt-0.5 block text-sm text-tenue">{{ q.evidencia }}</span>
                  </span>
                  @if (q.ruta !== '/cumplimiento') {
                    <a [routerLink]="q.ruta" class="inline-flex items-center gap-1 rounded-lg border border-fog px-3 py-1.5 text-xs text-forest transition hover:border-forest">Ver evidencia <app-icono nombre="flecha" clase="h-3.5 w-3.5" /></a>
                  }
                </li>
              }
            </ul>
          </section>
        }
      }
    </app-estado>
  `,
})
export class CumplimientoPagina {
  protected readonly r = httpResource<Requisito[]>(() => '/api/cumplimiento');
  private readonly confeti = inject(Confeti);
  private readonly anillo = viewChild<ElementRef<HTMLElement>>('anillo');
  private celebrado = false;

  constructor() {
    // Si nada bloquea la entrega, una pequeña celebración al terminar de llenarse el anillo
    effect(() => {
      if (this.r.value() && this.cuenta('mal') === 0 && this.anillo() && !this.celebrado) {
        this.celebrado = true;
        setTimeout(() => this.confeti.desde(this.anillo()?.nativeElement, 100), 1300);
      }
    });
  }
  protected readonly grupos = computed(() => {
    const rs = this.r.value() ?? [];
    return [...new Set(rs.map((q) => q.criterio))].map((id) => ({ id, items: rs.filter((q) => q.criterio === id) }));
  });
  protected cuenta(t: 'ok' | 'aviso' | 'mal') {
    const rs = this.r.value() ?? [];
    return rs.filter((q) => (t === 'ok' ? q.cumplido : t === 'aviso' ? !q.cumplido && q.aviso : !q.cumplido && !q.aviso)).length;
  }
  protected nombre(id: string) {
    return NOMBRES[id] ?? id;
  }
}
