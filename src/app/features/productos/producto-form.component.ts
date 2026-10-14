import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Categoria, Producto, ProductoRequest } from '../../core/models/producto.model';
import { ProductoService } from '../../core/services/producto.service';
import { esInvalido } from '../../shared/form.util';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastService } from '../../shared/toast/toast.service';

/** El precio contratista no puede ser mayor al minorista. */
function contratistaMenorOIgual(grupo: AbstractControl): ValidationErrors | null {
  const minorista = grupo.get('precioMinorista')?.value;
  const contratista = grupo.get('precioContratista')?.value;
  return minorista != null && contratista != null && contratista > minorista ? { contratistaMayor: true } : null;
}

/** Modal para crear o editar un producto (solo ADMIN). */
@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './producto-form.component.html'
})
export class ProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private toast = inject(ToastService);

  /** null = nuevo producto */
  @Input() producto: Producto | null = null;
  @Input() categorias: Categoria[] = [];
  @Output() guardado = new EventEmitter<Producto>();
  @Output() cerrar = new EventEmitter<void>();

  guardando = false;
  invalido = esInvalido;

  unidades = ['bolsa', 'varilla', 'galón', 'unidad', 'rollo', 'metro', 'kg', 'caja'];

  form = this.fb.group(
    {
      sku: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', Validators.maxLength(300)],
      idCategoria: [null as number | null, Validators.required],
      unidadMedida: ['unidad', [Validators.required, Validators.maxLength(20)]],
      precioMinorista: [null as number | null, [Validators.required, Validators.min(0.01)]],
      precioContratista: [null as number | null, [Validators.required, Validators.min(0.01)]],
      cantidadMinimaDescuento: [0, [Validators.required, Validators.min(0)]],
      porcentajeDescuento: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]]
    },
    { validators: contratistaMenorOIgual }
  );

  ngOnInit(): void {
    if (this.producto) {
      // Si el producto se creó con una unidad que no está en la lista, se agrega para no perderla.
      if (!this.unidades.includes(this.producto.unidadMedida)) {
        this.unidades = [...this.unidades, this.producto.unidadMedida];
      }
      this.form.patchValue(this.producto);
    }
  }

  get titulo(): string {
    return this.producto ? `Editar ${this.producto.sku}` : 'Nuevo producto';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue() as ProductoRequest;
    datos.descripcion = datos.descripcion?.trim() || null;

    this.guardando = true;
    const peticion = this.producto
      ? this.productoService.editar(this.producto.idProducto, datos)
      : this.productoService.crear(datos);

    peticion.subscribe({
      next: (producto) => {
        this.toast.exito(this.producto ? 'Producto actualizado.' : 'Producto creado con stock 0 en cada almacén.');
        this.guardado.emit(producto);
      },
      error: () => (this.guardando = false)
    });
  }
}
