import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Almacen, Producto } from '../../core/models/producto.model';
import { Movimiento, TipoMovimiento } from '../../core/models/stock.model';
import { ProductoService } from '../../core/services/producto.service';
import { StockService } from '../../core/services/stock.service';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';

/** Movimientos de stock de un producto (ADMIN, ALMACENERO). */
@Component({
  selector: 'app-kardex',
  imports: [RouterLink, FechaPipe, TablaPaginadaComponent],
  templateUrl: './kardex.component.html'
})
export class KardexComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private stockService = inject(StockService);
  private productoService = inject(ProductoService);

  producto: Producto | null = null;
  almacenes: Almacen[] = [];
  movimientos: Movimiento[] = [];
  cargando = true;

  readonly tipos: Record<TipoMovimiento, { texto: string; clase: string; signo: string }> = {
    INGRESO: { texto: 'Ingreso', clase: 'text-bg-success', signo: '+' },
    AJUSTE: { texto: 'Ajuste', clase: 'text-bg-secondary', signo: '' },
    RESERVA: { texto: 'Reserva', clase: 'text-bg-warning', signo: '' },
    LIBERACION: { texto: 'Liberación', clase: 'text-bg-info', signo: '' },
    SALIDA_VENTA: { texto: 'Salida por venta', clase: 'text-bg-danger', signo: '−' }
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('idProducto'));
    forkJoin({
      producto: this.productoService.obtener(id),
      almacenes: this.productoService.listarAlmacenes(),
      movimientos: this.stockService.kardex(id)
    }).subscribe({
      next: ({ producto, almacenes, movimientos }) => {
        this.producto = producto;
        this.almacenes = almacenes;
        // Lo más reciente primero
        this.movimientos = movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha));
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  tipo(m: Movimiento): { texto: string; clase: string; signo: string } {
    return this.tipos[m.tipo];
  }

  nombreAlmacen(id: number): string {
    return this.almacenes.find((a) => a.idAlmacen === id)?.nombre ?? `#${id}`;
  }
}
