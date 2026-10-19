import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { sinMovimiento } from '../core/movimiento';

/** Aparición al entrar en pantalla: <section appRevelar>. Sin movimiento reducido, se muestra de inmediato. */
@Directive({ selector: '[appRevelar]', host: { class: 'revelar' } })
export class Revelar implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private obs?: IntersectionObserver;

  ngOnInit() {
    const nodo = this.el.nativeElement as HTMLElement;
    if (sinMovimiento() || typeof IntersectionObserver === 'undefined') {
      nodo.classList.add('revelar--visible');
      return;
    }
    this.obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) { nodo.classList.add('revelar--visible'); this.obs?.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    this.obs.observe(nodo);
  }
  ngOnDestroy() {
    this.obs?.disconnect();
  }
}
