import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Cliente } from '../../core/models/cliente.model';
import { EstadoPedido, Pedido } from '../../core/models/pedido.model';
import { ClienteService } from '../../core/services/cliente.service';
import { PedidoService } from '../../core/services/pedido.service';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';
import { ClienteFormComponent } from './cliente-form.component';

/** Estados que cuentan como compra concretada. */
const ESTADOS_COMPRA: EstadoPedido[] = ['PAGADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'];

/** Ficha del cliente con su historial de compras. */
@Component({
  selector: 'app-cliente-detalle',
  imports: [RouterLink, BadgeEstadoComponent, FechaPipe, MonedaPipe, TablaPaginadaComponent, ClienteFormComponent],
  templateUrl: './cliente-detalle.component.html'
})
export class ClienteDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private clienteService = inject(ClienteService);
  private pedidoService = inject(PedidoService);

  cliente: Cliente | null = null;
  pedidos: Pedido[] = [];
  cargandoPedidos = true;
  editando = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.clienteService.obtener(id).subscribe((cliente) => (this.cliente = cliente));
    this.pedidoService.listarPorCliente(id).subscribe({
      next: (pedidos) => {
        this.pedidos = pedidos.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
        this.cargandoPedidos = false;
      },
      error: () => (this.cargandoPedidos = false)
    });
  }

  get compras(): Pedido[] {
    return this.pedidos.filter((p) => ESTADOS_COMPRA.includes(p.estado));
  }

  get montoComprado(): number {
    return this.compras.reduce((suma, p) => suma + p.total, 0);
  }

  alGuardar(cliente: Cliente): void {
    this.cliente = cliente;
    this.editando = false;
  }
}
