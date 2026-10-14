import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MetodoPago, NOMBRE_METODO_PAGO, Pedido, PagoRequest, TipoEntrega } from '../../core/models/pedido.model';
import { PedidoService } from '../../core/services/pedido.service';
import { esInvalido } from '../../shared/form.util';
import { ModalComponent } from '../../shared/modal/modal.component';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { ToastService } from '../../shared/toast/toast.service';

/**
 * Registrar pago (CAJERO, ADMIN): PENDIENTE_PAGO -> PAGADO.
 * Pago al contado: el monto es el total del pedido y no se edita.
 */
@Component({
  selector: 'app-pago-form',
  imports: [ReactiveFormsModule, ModalComponent, MonedaPipe],
  templateUrl: './pago-form.component.html'
})
export class PagoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pedidoService = inject(PedidoService);
  private toast = inject(ToastService);

  @Input({ required: true }) pedido!: Pedido;
  /** Dirección del cliente para sugerirla en delivery (si se conoce). */
  @Input() direccionSugerida: string | null = null;
  @Output() pagado = new EventEmitter<Pedido>();
  @Output() cerrar = new EventEmitter<void>();

  readonly metodos = Object.entries(NOMBRE_METODO_PAGO) as [MetodoPago, string][];
  readonly iconos: Record<MetodoPago, string> = {
    EFECTIVO: 'bi-cash',
    TARJETA: 'bi-credit-card',
    YAPE_PLIN: 'bi-phone',
    TRANSFERENCIA: 'bi-bank'
  };

  guardando = false;
  invalido = esInvalido;

  form = this.fb.nonNullable.group({
    metodo: ['EFECTIVO' as MetodoPago, Validators.required],
    numeroOperacion: ['', Validators.maxLength(50)],
    tipoEntrega: ['RECOJO' as TipoEntrega, Validators.required],
    direccionEntrega: ['', Validators.maxLength(250)]
  });

  ngOnInit(): void {
    const { metodo, tipoEntrega, numeroOperacion, direccionEntrega } = this.form.controls;

    // Número de operación obligatorio salvo en efectivo.
    metodo.valueChanges.subscribe((m) => {
      numeroOperacion.setValidators(
        m === 'EFECTIVO' ? [Validators.maxLength(50)] : [Validators.required, Validators.maxLength(50)]
      );
      numeroOperacion.updateValueAndValidity();
    });

    // Dirección obligatoria solo para delivery.
    tipoEntrega.valueChanges.subscribe((t) => {
      direccionEntrega.setValidators(
        t === 'DELIVERY' ? [Validators.required, Validators.maxLength(250)] : [Validators.maxLength(250)]
      );
      if (t === 'DELIVERY' && !direccionEntrega.value && this.direccionSugerida) {
        direccionEntrega.setValue(this.direccionSugerida);
      }
      direccionEntrega.updateValueAndValidity();
    });
  }

  get esEfectivo(): boolean {
    return this.form.controls.metodo.value === 'EFECTIVO';
  }

  get esDelivery(): boolean {
    return this.form.controls.tipoEntrega.value === 'DELIVERY';
  }

  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: PagoRequest = {
      metodo: v.metodo,
      monto: this.pedido.total,
      numeroOperacion: this.esEfectivo ? null : v.numeroOperacion.trim(),
      tipoEntrega: v.tipoEntrega,
      direccionEntrega: this.esDelivery ? v.direccionEntrega.trim() : null
    };

    this.guardando = true;
    this.pedidoService.registrarPago(this.pedido.idPedido, datos).subscribe({
      next: (pedido) => {
        this.toast.exito(`Pago registrado. El pedido ${pedido.codigo} pasó a almacén para su preparación.`);
        this.pagado.emit(pedido);
      },
      error: () => (this.guardando = false)
    });
  }
}
