import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria } from '../../core/models/producto.model';
import { ProductoService } from '../../core/services/producto.service';
import { esInvalido } from '../../shared/form.util';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';
import { ToastService } from '../../shared/toast/toast.service';

/** Categorías de productos (solo ADMIN): listar y crear. */
@Component({
  selector: 'app-categorias',
  imports: [ReactiveFormsModule, TablaPaginadaComponent],
  templateUrl: './categorias.component.html'
})
export class CategoriasComponent implements OnInit {
  private productoService = inject(ProductoService);
  private toast = inject(ToastService);

  categorias: Categoria[] = [];
  cargando = true;
  guardando = false;
  invalido = esInvalido;

  nombre = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.productoService.listarCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  crear(): void {
    const nombre = this.nombre.value.trim();
    if (!nombre || this.nombre.invalid) {
      this.nombre.markAsTouched();
      return;
    }
    this.guardando = true;
    this.productoService.crearCategoria(nombre).subscribe({
      next: (categoria) => {
        this.toast.exito(`Categoría "${categoria.nombre}" creada.`);
        this.nombre.reset();
        this.guardando = false;
        this.cargar();
      },
      error: () => (this.guardando = false)
    });
  }
}
