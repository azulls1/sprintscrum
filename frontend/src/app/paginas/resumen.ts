import { Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Avatar } from '../componentes/avatar';
import { Burndown } from '../componentes/burndown';
import { DiagramaFig } from '../componentes/diagrama';
import { Figura } from '../componentes/figura';
import { Revelar } from '../componentes/revelar';
import { Estado } from '../componentes/estado';
import { Icono, NombreIcono } from '../componentes/icono';
import { Kpi } from '../componentes/kpi';
import { Requisito, Resumen, Sprint } from '../core/modelos';

@Component({
  selector: 'app-resumen',
  imports: [Avatar, Burndown, DiagramaFig, Estado, Figura, Icono, Kpi, Revelar, RouterLink],
  template: `
    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.hasValue()" (reintentar)="r.reload()">
      @if (r.value(); as d) {
        <section class="card-hero !p-6 !text-left sm:!p-10 animate-fadeInUp">
          <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div class="orbe absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#5B7065]/25 blur-3xl"></div>
            <div class="orbe orbe--lento absolute -bottom-28 left-16 h-64 w-64 rounded-full bg-[#9EADA3]/15 blur-3xl"></div>
          </div>
          <div class="relative grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div>
              <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-[11px] text-white/85">
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span> Actividad 1 grupal · Equipo 2073 F</span>
              @if (cuentaRegresiva(); as c) {
                <span class="ml-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-white/70">
                  <span class="latido inline-block">⏳</span> {{ c }}</span>
              }
              <h1 class="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">Planeación de un sprint Scrum<br class="hidden sm:block" /> de una semana para {{ d.proyecto.producto }}</h1>
              <p class="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75">{{ d.proyecto.empresa }} desarrolla para {{ d.proyecto.cliente }} una
                aplicación web de citas. Objetivo del sprint: <span class="text-white">{{ d.proyecto.objetivo_sprint }}.</span></p>
              <div class="mt-6 flex flex-wrap gap-3">
                <a routerLink="/sprint-backlog" class="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-forest shadow-lg transition hover:-translate-y-0.5">
                  <app-icono nombre="tablero" clase="h-4 w-4" /> Ver el sprint backlog</a>
                <a routerLink="/simulacion" class="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white/10">
                  <app-icono nombre="burndown" clase="h-4 w-4" /> Simular el sprint</a>
                <a routerLink="/entregables" class="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white/10">
                  <app-icono nombre="descarga" clase="h-4 w-4" /> Entregables</a>
              </div>
            </div>
            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
              <p class="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Equipo Scrum</p>
              <ul class="grid gap-2.5">
                @for (i of d.integrantes; track i.id; let k = $index) {
                  <li class="flex items-center gap-3 animate-slideInRight" [style.animation-delay.ms]="300 + k * 120"><app-avatar [id]="i.id" [nombre]="i.nombre" />
                    <span class="min-w-0 leading-tight"><span class="block truncate text-sm text-white">{{ i.nombre }}</span>
                      <span class="block truncate font-mono text-[10px] text-white/55">{{ i.rol }}</span></span></li>
                }
              </ul>
            </div>
          </div>
        </section>

        <section class="stagger-children mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Cifras del sprint">
          <app-kpi etiqueta="Product backlog" [valor]="d.kpis.historias + ' historias'" [detalle]="d.kpis.puntos_backlog + ' puntos de historia'" icono="pila" />
          <app-kpi etiqueta="En el sprint" [valor]="d.kpis.puntos_sprint + ' puntos'" [detalle]="d.kpis.historias_sprint + ' historias seleccionadas'" icono="diana" />
          <app-kpi etiqueta="Sprint backlog" [valor]="d.kpis.tareas + ' tareas'" [detalle]="d.kpis.horas + ' horas estimadas'" icono="tablero" />
          <app-kpi etiqueta="Duración" [valor]="d.kpis.dias + ' días'" [detalle]="d.kpis.eventos + ' eventos Scrum'" icono="calendario" />
        </section>

        <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]" appRevelar>
          <section class="panel">
            <h2 class="seccion">Burndown planeado</h2>
            @if (s.value(); as sp) { <app-burndown [datos]="sp.burndown" /> }
            <p class="mt-2 text-xs text-tenue">Horas estimadas pendientes al cierre de cada día según el calendario del plan. La
              <a routerLink="/simulacion" class="text-forest underline underline-offset-2">simulación</a> agrega la incertidumbre.</p>
          </section>
          <section class="panel">
            <h2 class="seccion">Rúbrica · dónde está cada criterio</h2>
            <ul class="grid gap-1.5">
              @for (c of criterios; track c.ruta) {
                <li><a [routerLink]="c.ruta" class="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-acento-suave">
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-acento-suave text-pine group-hover:bg-forest group-hover:text-white">
                    <app-icono [nombre]="c.icono" clase="h-4 w-4" /></span>
                  <span class="flex-1 text-sm text-forest">{{ c.texto }}</span>
                  <span class="font-mono text-[10px] text-moss">{{ c.id }}</span></a></li>
              }
            </ul>
            @if (estadoCumplimiento(); as e) {
              <a routerLink="/cumplimiento" class="mt-3 flex items-center gap-2 rounded-lg bg-bien-suave px-3 py-2 text-xs text-bien">
                <app-icono nombre="escudo" clase="h-4 w-4" /> {{ e }}</a>
            }
          </section>
        </div>

        <h2 class="seccion mt-10">El sprint en una imagen</h2>
        <div class="grid gap-6 lg:grid-cols-[1fr_1fr]" appRevelar>
          <app-diagrama id="ciclo-scrum" />
          <app-diagrama id="arquitectura" />
        </div>
        <h2 class="seccion mt-10">Recorre la semana en la máquina del sprint</h2>
        <div appRevelar><app-figura carpeta="anatomia" titulo="Anatomía de un sprint de una semana" alto="46rem"
             pie="Arrastra la máquina o usa las flechas: backlog → planning → lunes a viernes → review" /></div>
      }
    </app-estado>
  `,
})
export class ResumenPagina {
  protected readonly r = httpResource<Resumen>(() => '/api/resumen');
  protected readonly s = httpResource<Sprint>(() => '/api/sprint');
  private readonly c = httpResource<Requisito[]>(() => '/api/cumplimiento');
  protected readonly estadoCumplimiento = computed(() => {
    const c = this.c.value();
    if (!c) return '';
    const avisos = c.filter((x) => x.aviso).length;
    return `${c.filter((x) => x.cumplido).length} de ${c.length} requisitos comprobados${avisos ? ` · ${avisos} con aviso` : ''}`;
  });
  /** Días que faltan para el cierre de la entrega en Moodle (lunes 26 de octubre de 2026, 23:59). */
  protected readonly cuentaRegresiva = computed(() => {
    const ms = new Date('2026-10-26T23:59:00-06:00').getTime() - Date.now();
    if (ms <= 0) return '';
    const dias = Math.floor(ms / 86400000);
    return dias >= 1 ? `Faltan ${dias} día${dias === 1 ? '' : 's'} para la entrega` : 'La entrega cierra hoy a las 23:59';
  });
  protected readonly criterios: { id: string; texto: string; ruta: string; icono: NombreIcono }[] = [
    { id: 'C1', texto: 'Descripción del proyecto', ruta: '/proyecto', icono: 'edificio' },
    { id: 'Roles', texto: 'Asignación de roles Scrum', ruta: '/equipo', icono: 'equipo' },
    { id: 'C2', texto: 'Product backlog', ruta: '/product-backlog', icono: 'pila' },
    { id: 'C3', texto: 'Sprint backlog', ruta: '/sprint-backlog', icono: 'tablero' },
    { id: 'C4', texto: 'Reflexiones individuales', ruta: '/reflexiones', icono: 'pluma' },
    { id: 'C5', texto: 'Conclusión grupal', ruta: '/conclusion', icono: 'foco' },
  ];
}
