import { NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, Input, OnChanges, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Tabla Bootstrap con búsqueda local y paginación.
 *
 * Uso:
 * <app-tabla-paginada [items]="productos" [camposBusqueda]="['sku', 'nombre']">
 *   <ng-template #cabecera><th>SKU</th><th>Nombre</th></ng-template>
 *   <ng-template #fila let-p><td>{{ p.sku }}</td><td>{{ p.nombre }}</td></ng-template>
 * </app-tabla-paginada>
 */
@Component({
  selector: 'app-tabla-paginada',
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './tabla-paginada.component.html'
})
export class TablaPaginadaComponent<T extends object> implements OnChanges {
  @Input() items: T[] = [];
  /** Propiedades donde busca el texto. Vacío = sin buscador. */
  @Input() camposBusqueda: string[] = [];
  @Input() placeholder = 'Buscar...';
  @Input() tamanoPagina = 10;
  @Input() cargando = false;
  @Input() mensajeVacio = 'No hay registros para mostrar.';
  /** Clase CSS opcional por fila (por ejemplo, filas críticas en rojo). */
  @Input() claseFila: (item: T) => string = () => '';

  @ContentChild('cabecera') cabecera!: TemplateRef<unknown>;
  @ContentChild('fila') fila!: TemplateRef<{ $implicit: T }>;

  texto = '';
  pagina = 1;
  filtrados: T[] = [];

  ngOnChanges(): void {
    this.filtrar();
  }

  filtrar(): void {
    const texto = this.texto.trim().toLowerCase();
    this.filtrados = !texto
      ? this.items
      : this.items.filter((item) =>
          this.camposBusqueda.some((campo) =>
            String((item as Record<string, unknown>)[campo] ?? '').toLowerCase().includes(texto)
          )
        );
    if (this.pagina > this.totalPaginas) {
      this.pagina = this.totalPaginas;
    }
  }

  buscar(): void {
    this.pagina = 1;
    this.filtrar();
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.filtrados.length / this.tamanoPagina));
  }

  get paginaActual(): T[] {
    const inicio = (this.pagina - 1) * this.tamanoPagina;
    return this.filtrados.slice(inicio, inicio + this.tamanoPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get desde(): number {
    return this.filtrados.length ? (this.pagina - 1) * this.tamanoPagina + 1 : 0;
  }

  get hasta(): number {
    return Math.min(this.pagina * this.tamanoPagina, this.filtrados.length);
  }

  irA(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.pagina = pagina;
    }
  }
}