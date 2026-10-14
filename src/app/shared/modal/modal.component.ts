
import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Modal de Bootstrap controlado desde Angular con un @if (sin el JS de Bootstrap).
 *
 * Uso:
 * @if (mostrar) {
 *   <app-modal titulo="Nuevo producto" (cerrar)="mostrar = false">
 *     ...contenido...
 *     <div pie> ...botones... </div>
 *   </app-modal>
 * }
 */
@Component({
  selector: 'app-modal',
  template: `
    <div class="modal d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" [class]="tamano ? 'modal-' + tamano : ''">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title">{{ titulo }}</h5>
            <button type="button" class="btn-close" (click)="cerrar.emit()"></button>
          </div>
          <div class="modal-body">
            <ng-content />
          </div>
          <div class="modal-footer">
            <ng-content select="[pie]" />
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() titulo = '';
  /** '', 'sm', 'lg' o 'xl' */
  @Input() tamano: '' | 'sm' | 'lg' | 'xl' = '';
  @Output() cerrar = new EventEmitter<void>();
}