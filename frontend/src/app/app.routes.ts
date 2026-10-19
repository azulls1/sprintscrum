import { Routes } from '@angular/router';

const t = (s: string) => `${s} · SprintScrum`;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'resumen' },
  { path: 'resumen', title: t('Resumen'), loadComponent: () => import('./paginas/resumen').then((m) => m.ResumenPagina) },
  { path: 'proyecto', title: t('Descripción del proyecto'), loadComponent: () => import('./paginas/proyecto').then((m) => m.ProyectoPagina) },
  { path: 'equipo', title: t('Equipo y roles'), loadComponent: () => import('./paginas/equipo').then((m) => m.EquipoPagina) },
  { path: 'product-backlog', title: t('Product backlog'), loadComponent: () => import('./paginas/backlog').then((m) => m.BacklogPagina) },
  { path: 'sprint-backlog', title: t('Sprint backlog'), loadComponent: () => import('./paginas/sprint').then((m) => m.SprintPagina) },
  { path: 'simulacion', title: t('Simulación del sprint'), loadComponent: () => import('./paginas/simulacion').then((m) => m.SimulacionPagina) },
  { path: 'reflexiones', title: t('Reflexiones individuales'), loadComponent: () => import('./paginas/reflexiones').then((m) => m.ReflexionesPagina) },
  { path: 'conclusion', title: t('Conclusión grupal'), loadComponent: () => import('./paginas/conclusion').then((m) => m.ConclusionPagina) },
  { path: 'cumplimiento', title: t('Cumplimiento'), loadComponent: () => import('./paginas/cumplimiento').then((m) => m.CumplimientoPagina) },
  { path: 'metodologia', title: t('Metodología'), loadComponent: () => import('./paginas/metodologia').then((m) => m.MetodologiaPagina) },
  { path: 'entregables', title: t('Entregables'), loadComponent: () => import('./paginas/entregables').then((m) => m.EntregablesPagina) },
  { path: '**', redirectTo: 'resumen' },
];
