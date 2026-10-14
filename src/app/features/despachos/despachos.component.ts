import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { ItemPedido, Pedido } from '../../core/models/pedido.model';
import { Almacen } from '../../core/models/producto.model';
import { PedidoService } from '../../core/services/pedido.service';
import { ProductoService } from '../../core/services/producto.service';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { esInvalido } from '../../shared/form.util';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import { ToastService } from '../../shared/toast/toast.service';

type Pestana = 'pendientes' | 'despachados' | 'entregados';

/** Fecha local en formato yyyy-MM-dd. */
function hoyIso(): string {
  const hoy = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
}

/**
 * Despachos (ADMIN, ALMACENERO):
 * PAGADO -> preparar -> EN_PREPARACION -> checklist -> despachar -> DESPACHADO -> entregar -> ENTREGADO.
 * La pestaña "Entregados hoy" es solo de consulta.
 */
@Component({
  selector: 'app-despachos',
  imports: [ReactiveFormsModule, BadgeEstadoComponent, FechaPipe],
  templateUrl: './despachos.component.html',
  styleUrl: './despachos.component.css'
})
export class DespachosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private productoService = inject(ProductoService);
  private toast = inject(ToastService);

  pestana: Pestana = 'pendientes';
  pendientes: Pedido[] = [];
  despachados: Pedido[] = [];
  entregados: Pedido[] = [];
  almacenes: Almacen[] = [];
  cargando = true;

  seleccionado: Pedido | null = null;
  procesando = false;
  invalido = esInvalido;
  repartidor = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] });

  ngOnInit(): void {
    this.productoService.listarAlmacenes().subscribe((a) => (this.almacenes = a));
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    forkJoin({
      pendientes: this.pedidoService.despachosPendientes(),
      despachados: this.pedidoService.listar({ estado: 'DESPACHADO' }),
      entregados: this.pedidoService.listar({ estado: 'ENTREGADO' })
    }).subscribe({
      next: ({ pendientes, despachados, entregados }) => {
        // Los más antiguos primero: se atienden en orden de pago.
        this.pendientes = pendientes.sort((a, b) => (a.fechaPago ?? '').localeCompare(b.fechaPago ?? ''));
        this.despachados = despachados.sort((a, b) => (a.fechaDespacho ?? '').localeCompare(b.fechaDespacho ?? ''));
        // Los filtros desde/hasta van por fecha de creación, así que el "hoy" se filtra por fecha de entrega aquí.
        const hoy = hoyIso();
        this.entregados = entregados
          .filter((p) => p.fechaEntrega?.startsWith(hoy))
          .sort((a, b) => (b.fechaEntrega ?? '').localeCompare(a.fechaEntrega ?? ''));
        this.cargando = false;
        // Mantiene la selección si el pedido sigue en la lista actual.
        const id = this.seleccionado?.idPedido;
        this.seleccionado = this.lista.find((p) => p.idPedido === id) ?? null;
      },
      error: () => (this.cargando = false)
    });
  }

  get lista(): Pedido[] {
    if (this.pestana === 'pendientes') return this.pendientes;
    return this.pestana === 'despachados' ? this.despachados : this.entregados;
  }

  /** Quién preparó el pedido; en registros antiguos solo se conoce el id. */
  almacenero(p: Pedido): string | null {
    if (p.almaceneroNombre) return p.almaceneroNombre;
    return p.almaceneroId ? `Usuario #${p.almaceneroId}` : null;
  }

  cambiarPestana(p: Pestana): void {
    this.pestana = p;
    this.seleccionado = null;
  }

  seleccionar(p: Pedido): void {
    this.seleccionado = p;
    this.repartidor.reset();
  }

  nombreAlmacen(id: number): string {
    return this.almacenes.find((a) => a.idAlmacen === id)?.nombre ?? '';
  }

  preparados(p: Pedido): number {
    return p.items.filter((i) => i.preparado).length;
  }

  todosPreparados(p: Pedido): boolean {
    return p.items.every((i) => i.preparado);
  }

  // ---------- Acciones ----------

  preparar(): void {
    this.ejecutar(this.pedidoService.preparar(this.seleccionado!.idPedido), 'Pedido en preparación. Marque los items a medida que los junta.');
  }

  /** Marcar un item como preparado (no se puede desmarcar). */
  marcarItem(item: ItemPedido): void {
    this.ejecutar(this.pedidoService.marcarPreparados(this.seleccionado!.idPedido, [item.idItem]));
  }

  marcarTodos(): void {
    const ids = this.seleccionado!.items.filter((i) => !i.preparado).map((i) => i.idItem);
    if (ids.length) {
      this.ejecutar(this.pedidoService.marcarPreparados(this.seleccionado!.idPedido, ids));
    }
  }

  despachar(): void {
    const p = this.seleccionado!;
    const esDelivery = p.tipoEntrega === 'DELIVERY';
    if (esDelivery && (this.repartidor.invalid || !this.repartidor.value.trim())) {
      this.repartidor.markAsTouched();
      return;
    }
    const repartidor = esDelivery ? this.repartidor.value.trim() : null;
    this.ejecutar(
      this.pedidoService.despachar(p.idPedido, repartidor),
      esDelivery ? `Pedido ${p.codigo} despachado con ${repartidor}.` : `Pedido ${p.codigo} listo para recojo.`,
      true
    );
  }

  entregar(): void {
    const p = this.seleccionado!;
    this.ejecutar(this.pedidoService.entregar(p.idPedido), `Pedido ${p.codigo} entregado al cliente.`, true);
  }

  /**
   * Ejecuta la acción y actualiza el pedido en pantalla.
   * Si el pedido cambia de pestaña (despachar / entregar) se recargan las listas.
   */
  private ejecutar(peticion: Observable<Pedido>, mensaje?: string, recargar = false): void {
    this.procesando = true;
    peticion.subscribe({
      next: (pedido) => {
        this.procesando = false;
        if (mensaje) this.toast.exito(mensaje);
        if (recargar) {
          this.seleccionado = null;
          this.cargar();
          return;
        }
        this.seleccionado = pedido;
        this.pendientes = this.pendientes.map((p) => (p.idPedido === pedido.idPedido ? pedido : p));
      },
      error: () => (this.procesando = false)
    });
  }
}
