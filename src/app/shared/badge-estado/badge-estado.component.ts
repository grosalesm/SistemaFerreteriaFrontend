import { Component, Input } from '@angular/core';

/** Color de cada estado de cotización y de pedido. */
const COLORES: Record<string, string> = {
  // Cotización
  BORRADOR: 'text-bg-secondary',
  ENVIADA: 'text-bg-primary',
  APROBADA: 'text-bg-success',
  RECHAZADA: 'text-bg-danger',
  VENCIDA: 'badge-naranja',
  CONVERTIDA: 'badge-morado',
  // Pedido
  PENDIENTE_PAGO: 'text-bg-warning',
  PAGADO: 'text-bg-primary',
  EN_PREPARACION: 'text-bg-info',
  DESPACHADO: 'badge-indigo',
  ENTREGADO: 'text-bg-success',
  ANULADO: 'text-bg-danger',
  VENCIDO: 'text-bg-secondary'
};

@Component({
  selector: 'app-badge-estado',
  template: `<span class="badge rounded-pill" [class]="color">{{ texto }}</span>`,
  styles: `
    .badge-naranja { background-color: #fd7e14; color: #fff; }
    .badge-morado { background-color: #6f42c1; color: #fff; }
    .badge-indigo { background-color: #3d0a91; color: #fff; }
  `
})
export class BadgeEstadoComponent {
  @Input({ required: true }) estado = '';

  get color(): string {
    return COLORES[this.estado] ?? 'text-bg-light';
  }

  /** PENDIENTE_PAGO -> Pendiente pago */
  get texto(): string {
    const t = this.estado.replace(/_/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
}