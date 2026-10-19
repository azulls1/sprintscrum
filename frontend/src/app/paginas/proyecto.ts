import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { DiagramaFig } from '../componentes/diagrama';
import { Icono } from '../componentes/icono';
import { Revelar } from '../componentes/revelar';
import { Proyecto } from '../core/modelos';

@Component({
  selector: 'app-proyecto',
  imports: [DiagramaFig, Encabezado, Estado, Icono, Revelar],
  template: `
    <app-encabezado titulo="Descripción del proyecto" icono="edificio" etiqueta="Criterio 1 · 20 %">
      <span entrada>¿Qué producto desarrollaríamos? Empresa, cliente y objetivos, tal como aparecen en el apartado 1 del documento
        (máximo 150 palabras).</span>
      @if (r.value(); as p) {
        <span class="rounded-full px-3 py-1 font-mono text-xs" [class]="(p.palabras ?? 0) <= 150 ? 'bg-bien-suave text-bien' : 'bg-mal-suave text-mal'">
          {{ p.palabras }} / 150 palabras</span>
      }
    </app-encabezado>

    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.hasValue()" (reintentar)="r.reload()">
      @if (r.value(); as p) {
        <section class="stagger-children grid gap-4 md:grid-cols-3">
          <article class="panel">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white"><app-icono nombre="edificio" /></span>
            <p class="seccion mt-4 !mb-1">Empresa</p>
            <p class="font-display text-lg font-semibold text-forest">{{ p.empresa }}</p>
            <p class="mt-1 text-sm text-tenue">Consultora mexicana de desarrollo de software (ficticia).</p>
          </article>
          <article class="panel">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white"><app-icono nombre="persona" /></span>
            <p class="seccion mt-4 !mb-1">Cliente</p>
            <p class="font-display text-lg font-semibold text-forest">{{ p.cliente }}</p>
            <p class="mt-1 text-sm text-tenue">Tres consultorios en Querétaro; hoy agenda por teléfono y WhatsApp.</p>
          </article>
          <article class="panel">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white"><app-icono nombre="cubo" /></span>
            <p class="seccion mt-4 !mb-1">Producto</p>
            <p class="font-display text-lg font-semibold text-forest">{{ p.producto }}</p>
            <p class="mt-1 text-sm text-tenue">Aplicación web responsive de citas para pacientes y recepción.</p>
          </article>
        </section>

        <section class="mt-6 grid gap-4 md:grid-cols-2">
          <article class="panel border-l-4 !border-l-forest">
            <p class="seccion !mb-2 flex items-center gap-2"><app-icono nombre="diana" clase="h-4 w-4" /> Objetivo del producto</p>
            <p class="text-[15px] leading-relaxed text-forest">{{ mayuscula(p.objetivo_producto) }}</p>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-acento-suave p-3 transition hover:-translate-y-0.5 hover:shadow-md"><p class="font-display text-2xl font-semibold text-forest">25 % → &lt;10 %</p><p class="text-xs text-tenue">inasistencias en seis meses</p></div>
              <div class="rounded-lg bg-acento-suave p-3 transition hover:-translate-y-0.5 hover:shadow-md"><p class="font-display text-2xl font-semibold text-forest">2 h / día</p><p class="text-xs text-tenue">liberadas en recepción</p></div>
            </div>
          </article>
          <article class="panel border-l-4 !border-l-[#2A78A8]">
            <p class="seccion !mb-2 flex items-center gap-2"><app-icono nombre="bandera" clase="h-4 w-4" /> Objetivo del sprint · {{ p.duracion_dias }} días hábiles</p>
            <p class="text-[15px] leading-relaxed text-forest">{{ mayuscula(p.objetivo_sprint) }}</p>
            <ol class="mt-4 flex flex-wrap items-center gap-2 text-xs">
              @for (paso of ['Registrarse', 'Ver disponibilidad', 'Reservar', 'Confirmación por correo']; track paso; let i = $index) {
                <li class="flex items-center gap-2 animate-fadeInUp" [style.animation-delay.ms]="400 + i * 180"><span class="rounded-full bg-forest px-2.5 py-1 text-white">{{ i + 1 }}. {{ paso }}</span>
                  @if (i < 3) { <app-icono nombre="flecha" clase="h-3.5 w-3.5 text-moss" /> }</li>
              }
            </ol>
          </article>
        </section>

        <h2 class="seccion mt-8">El paciente, antes y con AgendaFácil</h2>
        <div appRevelar><app-diagrama id="recorrido-paciente" /></div>
        <h2 class="seccion mt-8">La vida de una cita</h2>
        <div appRevelar><app-diagrama id="estados-cita" /></div>

        <h2 class="seccion mt-8">Texto del documento · apartado 1</h2>
        <section class="panel" appRevelar>
          @for (parrafo of p.descripcion; track $index) {
            <p class="mb-3 text-[15px] leading-relaxed text-evergreen last:mb-0">
              @if (parrafo.indexOf(':') > 0 && parrafo.indexOf(':') < 40) {
                <strong class="text-forest">{{ parrafo.slice(0, parrafo.indexOf(':') + 1) }}</strong>{{ parrafo.slice(parrafo.indexOf(':') + 1) }}
              } @else { {{ parrafo }} }
            </p>
          }
        </section>
      }
    </app-estado>
  `,
})
export class ProyectoPagina {
  protected readonly r = httpResource<Proyecto>(() => '/api/proyecto');
  protected mayuscula(t: string) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
}
