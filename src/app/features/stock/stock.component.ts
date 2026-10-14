import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Almacen, Producto } from '../../core/models/producto.model';
import { Stock } from '../../core/models/stock.model';
import { AuthService } from '../../core/services/auth.service';
import { ProductoService } from '../../core/services/producto.service';
import { StockService } from '../../core/services/stock.service';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';
import { StockFormComponent, TipoMovimientoForm } from './stock-form.component';

/** Fila de la tabla: el stock más los datos del producto para mostrar y buscar. */
export interface FilaStock extends Stock {
  sku: string;
  nombre: string;
  unidadMedida: string;
  stockMinimo: number;
  almacen: string;
  critico: boolean;
}

/** Stock por almacén: ADMIN y ALMACENERO gestionan; VENDEDOR solo ve. */
@Component({
  selector: 'app-stock',
  imports: [FormsModule, RouterLink, TablaPaginadaComponent, StockFormComponent],
  templateUrl: './stock.component.html'
})
export class StockComponent implements OnInit {
  private stockService = inject(StockService);
  private productoService = inject(ProductoService);

  puedeGestionar = inject(AuthService).tieneRol(['ALMACENERO']);

  almacenes: Almacen[] = [];
  private productos = new Map<number, Producto>();
  filas: FilaStock[] = [];
  /** filas con el filtro "solo críticos" aplicado */
  visibles: FilaStock[] = [];
  cargando = true;

  /** null = todos los almacenes */
  idAlmacen: number | null = null;
  soloCriticos = false;

  /** Modal de ajuste o ingreso abierto */
  movimiento: { tipo: TipoMovimientoForm; fila: FilaStock } | null = null;

  ngOnInit(): void {
    forkJoin({
      almacenes: this.productoService.listarAlmacenes(),
      productos: this.productoService.listar({ incluirInactivos: true })
    }).subscribe(({ almacenes, productos }) => {
      this.almacenes = almacenes;
      productos.forEach((p) => this.productos.set(p.idProducto, p));
      this.cargar();
    });
  }

  cargar(): void {
    this.cargando = true;
    this.stockService.listar(this.idAlmacen).subscribe({
      next: (stock) => {
        this.filas = stock.map((s) => this.armarFila(s));
        this.filtrarCriticos();
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  seleccionarAlmacen(id: number | null): void {
    this.idAlmacen = id;
    this.cargar();
  }

  filtrarCriticos(): void {
    this.visibles = this.soloCriticos ? this.filas.filter((f) => f.critico) : this.filas;
  }

  get totalCriticos(): number {
    return this.filas.filter((f) => f.critico).length;
  }

  claseFila = (f: FilaStock): string => (f.critico ? 'table-danger' : '');

  abrir(tipo: TipoMovimientoForm, fila: FilaStock): void {
    this.movimiento = { tipo, fila };
  }

  /** Reemplaza la fila con la respuesta del ajuste o ingreso. */
  alGuardar(stock: Stock): void {
    this.movimiento = null;
    // La respuesta de ingreso / ajuste trae productoActivo en null: se conserva el de la fila.
    this.filas = this.filas.map((f) =>
      f.idStock === stock.idStock ? this.armarFila({ ...stock, productoActivo: stock.productoActivo ?? f.productoActivo }) : f
    );
    this.filtrarCriticos();
  }

  private armarFila(s: Stock): FilaStock {
    const p = this.productos.get(s.idProducto);
    const stockMinimo = p?.stockMinimo ?? 0;
    return {
      ...s,
      sku: p?.sku ?? `#${s.idProducto}`,
      nombre: p?.nombre ?? 'Producto no encontrado',
      unidadMedida: p?.unidadMedida ?? '',
      stockMinimo,
      almacen: this.almacenes.find((a) => a.idAlmacen === s.idAlmacen)?.nombre ?? `#${s.idAlmacen}`,
      critico: s.disponible <= stockMinimo
    };
  }
}
