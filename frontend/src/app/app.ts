import { Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icono, NombreIcono } from './componentes/icono';
import { Requisito } from './core/modelos';

interface Enlace {
  ruta: string;
  texto: string;
  icono: NombreIcono;
  criterio?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono],
  templateUrl: './app.html',
})
export class App {
  protected readonly menuAbierto = signal(false);
  private readonly cumplimiento = httpResource<Requisito[]>(() => '/api/cumplimiento');
  /** Insignia del menú calculada desde la API, no escrita a mano. */
  protected readonly insignias = computed<Record<string, string>>(() => {
    const c = this.cumplimiento.value();
    const r: Record<string, string> = {};
    if (c) r['/cumplimiento'] = `${c.filter((q) => q.cumplido).length}/${c.length}`;
    return r;
  });
  protected readonly grupos: { titulo: string; enlaces: Enlace[] }[] = [
    { titulo: 'Principal', enlaces: [{ ruta: '/resumen', texto: 'Resumen', icono: 'inicio' }] },
    {
      titulo: 'La actividad',
      enlaces: [
        { ruta: '/proyecto', texto: 'Proyecto', icono: 'edificio', criterio: 'C1' },
        { ruta: '/equipo', texto: 'Equipo y roles', icono: 'equipo' },
        { ruta: '/product-backlog', texto: 'Product backlog', icono: 'pila', criterio: 'C2' },
        { ruta: '/sprint-backlog', texto: 'Sprint backlog', icono: 'tablero', criterio: 'C3' },
        { ruta: '/reflexiones', texto: 'Reflexiones', icono: 'pluma', criterio: 'C4' },
        { ruta: '/conclusion', texto: 'Conclusión', icono: 'foco', criterio: 'C5' },
      ],
    },
    { titulo: 'En vivo', enlaces: [{ ruta: '/simulacion', texto: 'Simulación del sprint', icono: 'burndown' }] },
    {
      titulo: 'Entrega',
      enlaces: [
        { ruta: '/cumplimiento', texto: 'Cumplimiento', icono: 'escudo' },
        { ruta: '/metodologia', texto: 'Metodología', icono: 'capas' },
        { ruta: '/entregables', texto: 'Entregables', icono: 'descarga' },
      ],
    },
  ];
}
