import { Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Avatar } from '../componentes/avatar';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { DiagramaFig } from '../componentes/diagrama';
import { Icono } from '../componentes/icono';
import { Revelar } from '../componentes/revelar';
import { COLOR_PERSONA, DIAS, Equipo, NOMBRE_ROL } from '../core/modelos';

@Component({
  selector: 'app-equipo',
  imports: [Avatar, DiagramaFig, Encabezado, Estado, Icono, Revelar],
  template: `
    <app-encabezado titulo="Equipo y roles Scrum" icono="equipo" etiqueta="Apartado 2 · asignación de roles">
      <span entrada>Product owner, Scrum master y dos desarrolladores. Como el equipo es de cuatro, el Scrum master también
        hace las pruebas (el enunciado permite repetir roles). Las horas salen del sprint backlog.</span>
    </app-encabezado>

    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.value()?.integrantes?.length" (reintentar)="r.reload()">
      @if (r.value(); as d) {
        <section class="stagger-children grid gap-4 md:grid-cols-2">
          @for (i of d.integrantes; track i.id) {
            <article class="panel flex flex-col">
              <header class="flex items-start gap-4">
                <app-avatar [id]="i.id" [nombre]="i.nombre" tam="lg" />
                <div class="min-w-0 flex-1">
                  <span class="rounded-full bg-acento-suave px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-pine">{{ rolScrum[i.rol_scrum] }}</span>
                  <h2 class="mt-1 font-display text-lg font-semibold text-forest">{{ i.nombre }}</h2>
                  <p class="text-sm text-tenue">{{ i.rol }}</p>
                </div>
                <div class="text-right"><p class="font-display text-2xl font-semibold text-forest tabular-nums">{{ i.carga.horas }} h</p>
                  <p class="font-mono text-[10px] text-moss">{{ i.carga.tareas }} tareas</p></div>
              </header>
              <p class="mt-4 text-sm leading-relaxed text-evergreen">{{ i.responsabilidad }}</p>

              <!-- Ocupación frente a la capacidad del sprint (26 h con 6 h/día menos los eventos) -->
              <div class="mt-4">
                <div class="mb-1 flex justify-between font-mono text-[10px] text-moss"><span>Ocupación del sprint</span><span>{{ pct(i.carga.horas) }} de {{ capacidad }} h</span></div>
                <div class="h-2 overflow-hidden rounded-full bg-fog/60" role="img" [attr.aria-label]="'Ocupación ' + pct(i.carga.horas)">
                  <div class="barra-ancho h-full rounded-full" [style.width]="pct(i.carga.horas)" [style.background]="color(i.id)"></div>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-5 gap-1" role="list" aria-label="Horas por día">
                @for (h of i.carga.por_dia; track $index) {
                  <div role="listitem" class="rounded-md bg-acento-suave/70 px-1 py-1.5 text-center">
                    <p class="font-mono text-[10px] text-moss">{{ dias[$index] }}</p>
                    <p class="font-mono text-xs text-forest tabular-nums">{{ h ? h + ' h' : '—' }}</p>
                  </div>
                }
              </div>

              @if (i.tareas.length) {
                <details class="group mt-4">
                  <summary class="cursor-pointer list-none text-sm font-medium text-forest">
                    <span class="inline-flex items-center gap-1"><app-icono nombre="flecha" clase="h-3.5 w-3.5 transition group-open:rotate-90" /> Sus tareas en el sprint</span></summary>
                  <ul class="mt-2 grid gap-1.5">
                    @for (t of i.tareas; track t.id) {
                      <li class="flex items-start gap-2 text-sm"><span class="mt-0.5 rounded bg-acento-suave px-1.5 font-mono text-[10px] text-pine">{{ t.historia_id }}</span>
                        <span class="flex-1 text-evergreen">{{ t.nombre }}</span><span class="font-mono text-xs text-moss">{{ t.horas }} h</span></li>
                    }
                  </ul>
                </details>
              }
            </article>
          }
        </section>

        <h2 class="seccion mt-8">Organigrama: clínica, consultora y equipo Scrum</h2>
        <div appRevelar><app-diagrama id="equipo-scrum" /></div>

        <h2 class="seccion mt-8">Eventos del sprint · quién los facilita</h2>
        <section class="panel !p-0 overflow-x-auto" appRevelar>
          <table class="tabla min-w-[36rem]">
            <thead><tr><th>Evento</th><th>Día</th><th>Hora</th><th>Duración</th><th>Facilita</th></tr></thead>
            <tbody>
              @for (e of d.eventos; track e.id) {
                <tr><td><span class="font-medium text-forest">{{ e.nombre }}</span><span class="block text-xs text-tenue">{{ e.descripcion }}</span></td>
                  <td class="font-mono">{{ e.dia_nombre }}</td><td class="font-mono">{{ e.hora }}</td>
                  <td class="font-mono">{{ e.duracion_min >= 60 ? e.duracion_min / 60 + ' h' : e.duracion_min + ' min' }}</td><td>{{ e.facilitador }}</td></tr>
              }
            </tbody>
          </table>
        </section>
        <p class="mt-2 text-xs text-tenue">Las horas de los eventos son una ampliación del portal; el documento fija el día y la duración.</p>
      }
    </app-estado>
  `,
})
export class EquipoPagina {
  protected readonly r = httpResource<Equipo>(() => '/api/equipo');
  protected readonly dias = DIAS;
  protected readonly rolScrum = NOMBRE_ROL;
  protected readonly capacidad = 26;
  protected readonly total = computed(() => (this.r.value()?.integrantes ?? []).reduce((a, i) => a + i.carga.horas, 0));
  protected pct(h: number) {
    return `${Math.round((h / this.capacidad) * 100)} %`;
  }
  protected color(id: number) {
    return COLOR_PERSONA[id];
  }
}
