import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Cliente } from '../../core/models/cliente.model';
import { Comprobante, NOMBRE_METODO_PAGO, Pedido } from '../../core/models/pedido.model';
import { Almacen } from '../../core/models/producto.model';
import { PERMISOS } from '../../core/permisos';
import { AuthService } from '../../core/services/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { PedidoService } from '../../core/services/pedido.service';
import { ProductoService } from '../../core/services/producto.service';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { confirmar } from '../../shared/confirmar';
import { esInvalido } from '../../shared/form.util';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PdfService } from '../../shared/pdf.service';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { ToastService } from '../../shared/toast/toast.service';
import { ComprobanteFormComponent } from './comprobante-form.component';
import { PagoFormComponent } from './pago-form.component';

/** Detalle del pedido con caja: pago, comprobante y anulación. */
@Component({
  selector: 'app-pedido-detalle',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BadgeEstadoComponent,
    ModalComponent,
    FechaPipe,
    MonedaPipe,
    PagoFormComponent,
    ComprobanteFormComponent
  ],
  templateUrl: './pedido-detalle.component.html'
})
export class PedidoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pedidoService = inject(PedidoService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private pdfService = inject(PdfService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  // Permisos de la pantalla
  puedeCobrar = this.auth.tieneRol(['CAJERO']);
  esAdmin = this.auth.tieneRol(['ADMIN']);
  verCotizacion = this.auth.tieneRol(PERMISOS.cotizaciones);
  /** El CAJERO no tiene acceso a /api/clientes. */
  private verCliente = this.auth.tieneRol(PERMISOS.clientes);

  readonly metodos = NOMBRE_METODO_PAGO;

  pedido: Pedido | null = null;
  cliente: Cliente | null = null;
  almacenes: Almacen[] = [];

  modal: 'pago' | 'comprobante' | 'anular' | null = null;
  motivo = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(300)] });
  invalido = esInvalido;
  anulando = false;
  generandoPdf = false;

  ngOnInit(): void {
    this.productoService.listarAlmacenes().subscribe((a) => (this.almacenes = a));
    this.cargar();
  }

  cargar(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pedidoService.obtener(id).subscribe((pedido) => {
      this.pedido = pedido;
      if (this.verCliente && !this.cliente) {
        this.clienteService.obtener(pedido.clienteId).subscribe((c) => (this.cliente = c));
      }
    });
  }

  get nombreAlmacen(): string {
    return this.almacenes.find((a) => a.idAlmacen === this.pedido?.idAlmacen)?.nombre ?? '';
  }

  get puedePagar(): boolean {
    return this.puedeCobrar && this.pedido?.estado === 'PENDIENTE_PAGO';
  }

  /** Comprobante: pedido con pago vigente y sin comprobante emitido. */
  get puedeEmitir(): boolean {
    const p = this.pedido;
    return this.puedeCobrar && !!p?.pago && !p.pago.devuelto && !p.comprobante && p.estado !== 'ANULADO';
  }

  get puedeAnular(): boolean {
    return this.esAdmin && (this.pedido?.estado === 'PENDIENTE_PAGO' || this.pedido?.estado === 'PAGADO');
  }

  /** Línea de tiempo del pedido (solo los pasos con fecha). */
  get pasos(): { texto: string; fecha: string | null; icono: string }[] {
    const p = this.pedido!;
    return [
      { texto: 'Pedido creado', fecha: p.fechaCreacion, icono: 'bi-bag' },
      { texto: 'Pagado', fecha: p.fechaPago, icono: 'bi-cash-coin' },
      { texto: 'En preparación', fecha: p.fechaPreparacion, icono: 'bi-box-seam' },
      { texto: 'Despachado', fecha: p.fechaDespacho, icono: 'bi-truck' },
      { texto: 'Entregado', fecha: p.fechaEntrega, icono: 'bi-check2-all' }
    ];
  }

  get itemsPreparados(): number {
    return this.pedido?.items.filter((i) => i.preparado).length ?? 0;
  }

  alPagar(pedido: Pedido): void {
    this.pedido = pedido;
    this.modal = null;
  }

  alEmitir(comprobante: Comprobante): void {
    this.modal = null;
    if (this.pedido) {
      this.pedido = { ...this.pedido, comprobante };
    }
  }

  abrirAnulacion(): void {
    this.motivo.reset();
    this.modal = 'anular';
  }

  async anular(): Promise<void> {
    const p = this.pedido!;
    if (this.motivo.invalid || !this.motivo.value.trim()) {
      this.motivo.markAsTouched();
      return;
    }
    const ok = await confirmar(
      `¿Anular el pedido ${p.codigo}?`,
      p.pago
        ? 'Se liberará el stock reservado y el pago quedará marcado como devuelto.'
        : 'Se liberará el stock reservado.',
      'Sí, anular',
      true
    );
    if (!ok) return;

    this.anulando = true;
    this.pedidoService.anular(p.idPedido, this.motivo.value.trim()).subscribe({
      next: (pedido) => {
        this.pedido = pedido;
        this.modal = null;
        this.anulando = false;
        this.toast.exito(`Pedido ${pedido.codigo} anulado.`);
      },
      error: () => (this.anulando = false)
    });
  }

  async descargarComprobante(): Promise<void> {
    const p = this.pedido!;
    if (!p.comprobante) return;
    this.generandoPdf = true;
    try {
      await this.pdfService.comprobante(p, p.comprobante);
    } catch {
      this.toast.error('No se pudo generar el PDF.');
    } finally {
      this.generandoPdf = false;
    }
  }
}
