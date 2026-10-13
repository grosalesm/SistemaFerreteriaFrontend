import { TipoCliente } from './cliente.model';

export type EstadoCotizacion = 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA' | 'CONVERTIDA';
export type Canal = 'WEB' | 'ANDROID';

export interface ItemCotizacion {
  idItem?: number;
  idProducto: number;
  sku: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  porcentajeDescuento: number;
  subtotal: number;
  /** Solo viene si falta stock en el almacén (informativo). */
  aviso?: string;
}

export interface HistorialCotizacion {
  idHistorial: number;
  estadoAnterior: EstadoCotizacion | null;
  estadoNuevo: EstadoCotizacion;
  usuarioId: number;
  fecha: string;
  comentario: string | null;
}

export interface Cotizacion {
  idCotizacion: number;
  codigo: string;
  clienteId: number;
  clienteNombre: string;
  tipoCliente: TipoCliente;
  vendedorId: number | null;
  canal: Canal;
  idAlmacen: number;
  estado: EstadoCotizacion;
  subtotal: number;
  descuentoTotal: number;
  igv: number;
  total: number;
  fechaCreacion: string;
  fechaVencimiento: string | null;
  fechaAprobacion: string | null;
  motivoRechazo: string | null;
  cotizacionOrigenId: number | null;
  items: ItemCotizacion[];
  historial: HistorialCotizacion[];
}

export interface ItemRequest {
  idProducto: number;
  cantidad: number;
}

export interface CotizacionRequest {
  clienteId: number;
  idAlmacen: number;
  items: ItemRequest[];
}

export interface FiltroCotizaciones {
  estado?: EstadoCotizacion | null;
  clienteId?: number | null;
  /** yyyy-MM-dd */
  desde?: string | null;
  hasta?: string | null;
}