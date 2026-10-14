import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EstadoPedido, FiltroPedidos, Pedido } from '../../core/models/pedido.model';
import { AuthService } from '../../core/services/auth.service';
import { PedidoService } from '../../core/services/pedido.service';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';

/** Pedidos / Caja: VENDEDOR y ADMIN consultan; CAJERO cobra y emite comprobantes. */
@Component({
  selector: 'app-pedidos',
  imports: [FormsModule, RouterLink, BadgeEstadoComponent, FechaPipe, MonedaPipe, TablaPaginadaComponent],
  templateUrl: './pedidos.component.html'
})
export class PedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private auth = inject(AuthService);

  readonly estados: EstadoPedido[] = [
    'PENDIENTE_PAGO',
    'PAGADO',
    'EN_PREPARACION',
    'DESPACHADO',
    'ENTREGADO',
    'ANULADO',
    'VENCIDO'
  ];

  pedidos: Pedido[] = [];
  cargando = true;
  // El cajero entra viendo lo que tiene por cobrar.
  filtro: FiltroPedidos = { estado: this.auth.rol === 'CAJERO' ? 'PENDIENTE_PAGO' : null, desde: null, hasta: null };

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.cargando = true;
    this.pedidoService.listar(this.filtro).subscribe({
      next: (lista) => {
        this.pedidos = lista.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  limpiar(): void {
    this.filtro = { estado: null, desde: null, hasta: null };
    this.buscar();
  }

  textoEstado(e: EstadoPedido): string {
    const t = e.replace(/_/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  /** Horas que quedan para pagar un pedido PENDIENTE_PAGO (24 h desde su creación). */
  horasParaPagar(p: Pedido): number {
    return Math.max(0, Math.floor((new Date(p.fechaLimitePago).getTime() - Date.now()) / 3_600_000));
  }
}
