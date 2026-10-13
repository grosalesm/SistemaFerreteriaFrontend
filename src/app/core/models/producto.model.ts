export interface DisponibleAlmacen {
  idAlmacen: number;
  disponible: number;
}

export interface Producto {
  idProducto: number;
  sku: string;
  nombre: string;
  descripcion: string | null;
  idCategoria: number;
  unidadMedida: string;
  precioMinorista: number;
  precioContratista: number;
  cantidadMinimaDescuento: number;
  porcentajeDescuento: number;
  stockMinimo: number;
  activo: boolean;
  fechaCreacion: string;
  /** física − reservada, sumado en todos los almacenes */
  disponible: number;
  disponiblePorAlmacen: DisponibleAlmacen[];
}

export interface ProductoRequest {
  sku: string;
  nombre: string;
  descripcion: string | null;
  idCategoria: number;
  unidadMedida: string;
  precioMinorista: number;
  precioContratista: number;
  cantidadMinimaDescuento: number;
  porcentajeDescuento: number;
  stockMinimo: number;
}

export interface FiltroProductos {
  idCategoria?: number | null;
  texto?: string | null;
  soloConStock?: boolean;
  incluirInactivos?: boolean;
}

export interface Categoria {
  idCategoria: number;
  nombre: string;
  activo: boolean;
}

export interface Almacen {
  idAlmacen: number;
  codigo: string;
  nombre: string;
}