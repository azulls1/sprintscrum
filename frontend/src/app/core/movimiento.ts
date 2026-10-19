/** Utilidades de movimiento: respetan prefers-reduced-motion y degradan sin View Transitions. */
export const sinMovimiento = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Ejecuta un cambio de estado dentro de una View Transition (las tarjetas «vuelan» a su nuevo sitio). */
export function conTransicion(cambio: () => void) {
  const doc = document as Document & { startViewTransition?: (f: () => void) => unknown };
  if (sinMovimiento() || !doc.startViewTransition) {
    cambio();
    return;
  }
  doc.startViewTransition(() => cambio());
}
