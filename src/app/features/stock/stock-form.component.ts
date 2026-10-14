import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Stock } from '../../core/models/stock.model';
import { StockService } from '../../core/services/stock.service';
import { esInvalido } from '../../shared/form.util';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastService } from '../../shared/toast/toast.service';
import type { FilaStock } from './stock.component';

export type TipoMovimientoForm = 'ingreso' | 'ajuste';

/**
 * Modal de stock:
 * - ingreso: suma unidades (compra / reposición).
 * - ajuste: fija la cantidad física contada (inventario), con motivo.
 */
@Component({
  selector: 'app-stock-form',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './stock-form.component.html'
})
export class StockFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private toast = inject(ToastService);

  @Input({ required: true }) tipo: TipoMovimientoForm = 'ingreso';
  @Input({ required: true }) fila!: FilaStock;
  @Output() guardado = new EventEmitter<Stock>();
  @Output() cerrar = new EventEmitter<void>();

  guardando = false;
  invalido = esInvalido;

  form = this.fb.nonNullable.group({
    cantidad: [0, [Validators.required]],
    motivo: ['']
  });

  ngOnInit(): void {
    const cantidad = this.form.controls.cantidad;
    if (this.tipo === 'ingreso') {
      cantidad.setValue(1);
      cantidad.addValidators(Validators.min(1));
    } else {
      // La cantidad física no puede quedar por debajo de lo reservado.
      cantidad.setValue(this.fila.cantidadFisica);
      cantidad.addValidators(Validators.min(this.fila.cantidadReservada));
      this.form.controls.motivo.addValidators([Validators.required, Validators.maxLength(200)]);
    }
  }

  get titulo(): string {
    return this.tipo === 'ingreso' ? 'Ingreso de mercadería' : 'Ajuste de inventario';
  }

  /** Cómo queda el stock si se guarda. */
  get nuevaFisica(): number {
    const cantidad = Number(this.form.controls.cantidad.value) || 0;
    return this.tipo === 'ingreso' ? this.fila.cantidadFisica + cantidad : cantidad;
  }

  get nuevoDisponible(): number {
    return this.nuevaFisica - this.fila.cantidadReservada;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { cantidad, motivo } = this.form.getRawValue();
    const base = { idProducto: this.fila.idProducto, idAlmacen: this.fila.idAlmacen };
    const peticion: Observable<Stock> =
      this.tipo === 'ingreso'
        ? this.stockService.ingresar({ ...base, cantidad })
        : this.stockService.ajustar({ ...base, nuevaCantidad: cantidad, motivo: motivo.trim() });

    this.guardando = true;
    peticion.subscribe({
      next: (stock) => {
        this.toast.exito(this.tipo === 'ingreso' ? 'Ingreso registrado.' : 'Ajuste registrado.');
        this.guardado.emit(stock);
      },
      error: () => (this.guardando = false)
    });
  }
}
