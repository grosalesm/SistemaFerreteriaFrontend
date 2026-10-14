import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente } from '../../core/models/cliente.model';
import { Comprobante, Pedido, TipoComprobante } from '../../core/models/pedido.model';
import { PedidoService } from '../../core/services/pedido.service';
import { esInvalido } from '../../shared/form.util';
import { ModalComponent } from '../../shared/modal/modal.component';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { ToastService } from '../../shared/toast/toast.service';

/** BOLETA con DNI (8 dígitos, serie B001) o FACTURA con RUC (11 dígitos, serie F001). */
const PATRON: Record<TipoComprobante, RegExp> = {
  BOLETA: /^\d{8}$/,
  FACTURA: /^\d{11}$/
};

/**
 * Emitir comprobante (CAJERO, ADMIN) de un pedido pagado. Solo uno por pedido.
 * - Con la ficha del cliente: el tipo sale de su documento (DNI -> boleta, RUC -> factura)
 *   y los datos quedan bloqueados.
 * - Sin la ficha (si su consulta falla): se elige el tipo y se escriben los datos.
 */
@Component({
  selector: 'app-comprobante-form',
  imports: [ReactiveFormsModule, ModalComponent, MonedaPipe],
  templateUrl: './comprobante-form.component.html'
})
export class ComprobanteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pedidoService = inject(PedidoService);
  private toast = inject(ToastService);

  @Input({ required: true }) pedido!: Pedido;
  /** Si se conoce la ficha del cliente, se completan sus datos. */
  @Input() cliente: Cliente | null = null;
  @Output() emitido = new EventEmitter<Comprobante>();
  @Output() cerrar = new EventEmitter<void>();

  guardando = false;
  invalido = esInvalido;

  form = this.fb.nonNullable.group({
    tipo: ['BOLETA' as TipoComprobante, Validators.required],
    documentoCliente: ['', [Validators.required, Validators.pattern(PATRON.BOLETA)]],
    razonSocial: ['', Validators.maxLength(150)]
  });

  ngOnInit(): void {
    const { tipo, documentoCliente } = this.form.controls;

    tipo.valueChanges.subscribe((t) => {
      documentoCliente.setValidators([Validators.required, Validators.pattern(PATRON[t])]);
      documentoCliente.updateValueAndValidity();
    });

    if (this.cliente) {
      this.form.setValue({
        tipo: this.cliente.tipoDocumento === 'RUC' ? 'FACTURA' : 'BOLETA',
        documentoCliente: this.cliente.numeroDocumento,
        razonSocial: this.cliente.nombreRazonSocial
      });
      this.form.disable();
    }
  }

  /** true si los datos vienen de la ficha del cliente y no se pueden cambiar. */
  get datosFijos(): boolean {
    return this.cliente !== null;
  }

  get esFactura(): boolean {
    return this.form.controls.tipo.value === 'FACTURA';
  }

  emitir(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.guardando = true;
    this.pedidoService
      .emitirComprobante(this.pedido.idPedido, {
        tipo: v.tipo,
        documentoCliente: v.documentoCliente.trim(),
        razonSocial: v.razonSocial.trim() || null
      })
      .subscribe({
        next: (comprobante) => {
          this.toast.exito(`Se emitió ${comprobante.tipo === 'FACTURA' ? 'la factura' : 'la boleta'} ${comprobante.numeroComprobante}.`);
          this.emitido.emit(comprobante);
        },
        error: () => (this.guardando = false)
      });
  }
}
