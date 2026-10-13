import { Component, inject } from '@angular/core';
import { TipoToast, ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3">
      @for (t of toastService.toasts; track t.id) {
        <div class="toast show border-0 shadow" role="alert">
          <div class="toast-header text-white" [class]="clases[t.tipo]">
            <i class="bi me-2" [class]="iconos[t.tipo]"></i>
            <strong class="me-auto">{{ t.titulo }}</strong>
            <button type="button" class="btn-close btn-close-white" (click)="toastService.cerrar(t.id)"></button>
          </div>
          <div class="toast-body">
            {{ t.mensaje }}
            @if (t.detalle.length) {
              <ul class="mb-0 mt-2 ps-3 small">
                @for (linea of t.detalle; track $index) {
                  <li>{{ linea }}</li>
                }
              </ul>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-container { z-index: 2000; }
  `
})
export class ToastComponent {
  toastService = inject(ToastService);

  clases: Record<TipoToast, string> = {
    exito: 'bg-success',
    error: 'bg-danger',
    aviso: 'bg-warning',
    info: 'bg-dark'
  };

  iconos: Record<TipoToast, string> = {
    exito: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    aviso: 'bi-exclamation-triangle-fill',
    info: 'bi-bell-fill'
  };
}