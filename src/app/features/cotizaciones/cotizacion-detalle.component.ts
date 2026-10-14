import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError, Faltante } from '../../core/models/api-error.model';
import { Cliente } from '../../core/models/cliente.model';
import { Cotizacion } from '../../core/models/cotizacion.model';
import { Almacen } from '../../core/models/producto.model';
import { ClienteService } from '../../core/services/cliente.service';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { ProductoService } from '../../core/services/producto.service';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { confirmar } from '../../shared/confirmar';
import { esInvalido } from '../../shared/form.util';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PdfService } from '../../shared/pdf.service';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { ToastService } from '../../shared/toast/toast.service';

/** Detalle de la cotización: items, totales, historial y acciones según el estado. */
@Component({
  selector: 'app-cotizacion-detalle',
  imports: [ReactiveFormsModule, RouterLink, BadgeEstadoComponent, ModalComponent, FechaPipe, MonedaPipe],
  templateUrl: './cotizacion-detalle.component.html',
  styles: `
    .historial li + li { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eef0f2; }
  `
})
export class CotizacionDetalleComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cotizacionService = inject(CotizacionService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private pdfService = inject(PdfService);
  private toast = inject(ToastService);

  cotizacion: Cotizacion | null = null;
  cliente: Cliente | null = null;
  almacenes: Almacen[] = [];
  procesando = false;
  generandoPdf = false;

  /** Faltantes del último intento de aprobación (409). */
  faltantes: Faltante[] = [];

  mostrarRechazo = false;
  motivo = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(300)] });
  invalido = esInvalido;

  private temporizador?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.productoService.listarAlmacenes().subscribe((a) => (this.almacenes = a));
    // Se suscribe al parámetro porque reenviar/duplicar navegan a otra cotización en la misma pantalla.
    this.route.paramMap.subscribe((params) => this.cargar(Number(params.get('id'))));
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
  }

  cargar(id: number): void {
    this.faltantes = [];
    this.cotizacionService.obtener(id).subscribe((cot) => {
      this.cotizacion = cot;
      if (this.cliente?.idCliente !== cot.clienteId) {
        this.clienteService.obtener(cot.clienteId).subscribe((c) => (this.cliente = c));
      }
    });
  }

  get nombreAlmacen(): string {
    const a = this.almacenes.find((x) => x.idAlmacen === this.cotizacion?.idAlmacen);
    return a ? `${a.nombre} (${a.codigo})` : '';
  }

  /** Una ENVIADA solo se puede aprobar si aún no pasó su fecha de vencimiento. */
  get vigente(): boolean {
    const vence = this.cotizacion?.fechaVencimiento;
    return !!vence && new Date(vence).getTime() > Date.now();
  }

  get estado(): string {
    return this.cotizacion?.estado ?? '';
  }

  // ---------- Acciones ----------

  async enviar(): Promise<void> {
    const cot = this.cotizacion!;
    const ok = await confirmar('¿Enviar la cotización?', 'Ya no se podrán editar los items y tendrá una vigencia de 7 días.', 'Sí, enviar');
    if (!ok) return;
    this.ejecutar(this.cotizacionService.enviar(cot.idCotizacion), 'Cotización enviada al cliente.');
  }

  async aprobar(): Promise<void> {
    const cot = this.cotizacion!;
    const ok = await confirmar(
      '¿Aprobar la cotización?',
      `Se reservará el stock y se generará el pedido por ${cot.total.toFixed(2)} soles.`,
      'Sí, aprobar'
    );
    if (!ok) return;

    this.procesando = true;
    this.faltantes = [];
    this.cotizacionService.aprobar(cot.idCotizacion).subscribe({
      next: (aprobada) => {
        this.procesando = false;
        this.cotizacion = aprobada;
        this.toast.exito('Cotización aprobada. Se generó el pedido en Pedidos / Caja (pendiente de pago).', 'Pedido generado');
        // ms-ventas crea el pedido de forma asíncrona y la cotización pasa a CONVERTIDA.
        this.temporizador = setTimeout(() => this.cargar(aprobada.idCotizacion), 3000);
      },
      error: (error: HttpErrorResponse) => {
        this.procesando = false;
        // El interceptor ya mostró el toast; aquí se deja la lista visible en la pantalla.
        const cuerpo = error.error as ApiError | null;
        if (error.status === 409 && cuerpo?.faltantes) {
          this.faltantes = cuerpo.faltantes;
        }
      }
    });
  }

  abrirRechazo(): void {
    this.motivo.reset();
    this.mostrarRechazo = true;
  }

  rechazar(): void {
    if (this.motivo.invalid || !this.motivo.value.trim()) {
      this.motivo.markAsTouched();
      return;
    }
    this.mostrarRechazo = false;
    this.ejecutar(
      this.cotizacionService.rechazar(this.cotizacion!.idCotizacion, this.motivo.value.trim()),
      'Cotización rechazada.'
    );
  }

  reenviar(): void {
    this.crearCopia(this.cotizacionService.reenviar(this.cotizacion!.idCotizacion), 'con los precios actuales');
  }

  duplicar(): void {
    this.crearCopia(this.cotizacionService.duplicar(this.cotizacion!.idCotizacion), '');
  }

  async descargarPdf(): Promise<void> {
    this.generandoPdf = true;
    try {
      await this.pdfService.cotizacion(this.cotizacion!, this.cliente, this.nombreAlmacen);
    } catch {
      this.toast.error('No se pudo generar el PDF.');
    } finally {
      this.generandoPdf = false;
    }
  }

  // ---------- Internos ----------

  private ejecutar(peticion: ReturnType<CotizacionService['enviar']>, mensaje: string): void {
    this.procesando = true;
    peticion.subscribe({
      next: (cot) => {
        this.cotizacion = cot;
        this.procesando = false;
        this.toast.exito(mensaje);
      },
      error: () => (this.procesando = false)
    });
  }

  /** reenviar y duplicar crean un BORRADOR nuevo: se navega a él. */
  private crearCopia(peticion: ReturnType<CotizacionService['duplicar']>, detalle: string): void {
    this.procesando = true;
    peticion.subscribe({
      next: (nueva) => {
        this.procesando = false;
        this.toast.exito(`Se creó el borrador ${nueva.codigo} ${detalle}`.trim() + '.');
        this.router.navigate(['/cotizaciones', nueva.idCotizacion]);
      },
      error: () => (this.procesando = false)
    });
  }
}
