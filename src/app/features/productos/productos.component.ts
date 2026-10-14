import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Almacen, Categoria, FiltroProductos, Producto } from '../../core/models/producto.model';
import { AuthService } from '../../core/services/auth.service';
import { ProductoService } from '../../core/services/producto.service';
import { confirmar } from '../../shared/confirmar';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ProductoFormComponent } from './producto-form.component';

/** Catálogo: ADMIN gestiona; VENDEDOR y ALMACENERO solo ven. */
@Component({
  selector: 'app-productos',
  imports: [FormsModule, MonedaPipe, TablaPaginadaComponent, ProductoFormComponent],
  templateUrl: './productos.component.html'
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private toast = inject(ToastService);

  esAdmin = inject(AuthService).tieneRol(['ADMIN']);

  productos: Producto[] = [];
  categorias: Categoria[] = [];
  almacenes: Almacen[] = [];
  cargando = true;

  filtro: FiltroProductos = { idCategoria: null, texto: '', soloConStock: false, incluirInactivos: false };

  /** Modal: undefined = cerrado, null = nuevo, Producto = editar */
  editando: Producto | null | undefined = undefined;

  ngOnInit(): void {
    forkJoin({
      categorias: this.productoService.listarCategorias(),
      almacenes: this.productoService.listarAlmacenes()
    }).subscribe(({ categorias, almacenes }) => {
      this.categorias = categorias;
      this.almacenes = almacenes;
    });
    this.buscar();
  }

  buscar(): void {
    this.cargando = true;
    this.productoService.listar(this.filtro).subscribe({
      next: (productos) => {
        this.productos = productos;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  limpiar(): void {
    this.filtro = { idCategoria: null, texto: '', soloConStock: false, incluirInactivos: false };
    this.buscar();
  }

  nombreCategoria(id: number): string {
    return this.categorias.find((c) => c.idCategoria === id)?.nombre ?? '—';
  }

  disponibleEn(producto: Producto, idAlmacen: number): number {
    return producto.disponiblePorAlmacen.find((d) => d.idAlmacen === idAlmacen)?.disponible ?? 0;
  }

  claseFila = (p: Producto): string => (p.activo ? '' : 'table-secondary text-muted');

  async cambiarEstado(producto: Producto): Promise<void> {
    const activar = !producto.activo;
    const ok = await confirmar(
      activar ? '¿Activar producto?' : '¿Desactivar producto?',
      activar
        ? `${producto.nombre} volverá a aparecer en el catálogo.`
        : `${producto.nombre} ya no se podrá cotizar.`,
      activar ? 'Sí, activar' : 'Sí, desactivar',
      !activar
    );
    if (!ok) {
      return;
    }
    this.productoService.cambiarEstado(producto.idProducto, activar).subscribe(() => {
      this.toast.exito(activar ? 'Producto activado.' : 'Producto desactivado.');
      this.buscar();
    });
  }

  alGuardar(): void {
    this.editando = undefined;
    this.buscar();
  }
}
