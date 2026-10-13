export type EstadoPedido =
  | 'PENDIENTE_PAGO'
  | 'PAGADO'
  | 'EN_PREPARACION'
  | 'DESPACHADO'
  | 'ENTREGADO'
  | 'ANULADO'
  | 'VENCIDO';

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'YAPE_PLIN' | 'TRANSFERENCIA';
export type TipoEntrega = 'RECOJO' | 'DELIVERY';
export type TipoComprobante = 'BOLETA' | 'FACTURA';

export interface ItemPedido {
  idItem: number;
  idProducto: number;
  sku: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  preparado: boolean;
}

export interface Pago {
  idPago: number;
  metodo: MetodoPago;
  monto: number;
  numeroOperacion: string | null;
  cajeroId: number;
  fecha: string;
  devuelto: boolean;
}

export interface Comprobante {
  idComprobante: number;
  idPedido: number;
  tipo: TipoComprobante;
  serie: string;
  numero: number;
  numeroComprobante: string;
  documentoCliente: string;
  razonSocial: string;
  subtotal: number;
  igv: number;
  total: number;
  fechaEmision: string;
}

export interface Pedido {
  idPedido: number;
  codigo: string;
  cotizacionId: number;
  codigoCotizacion: string;
  clienteId: number;
  clienteNombre: string;
  idAlmacen: number;
  estado: EstadoPedido;
  total: number;
  tipoEntrega: TipoEntrega | null;
  direccionEntrega: string | null;
  repartidor: string | null;
  fechaCreacion: string;
  fechaLimitePago: string;
  fechaPago: string | null;
  fechaPreparacion: string | null;
  fechaDespacho: string | null;
  fechaEntrega: string | null;
  almaceneroId: number | null;
  motivoAnulacion: string | null;
  items: ItemPedido[];
  pago: Pago | null;
  comprobante: Comprobante | null;
}

export interface PagoRequest {
  metodo: MetodoPago;
  /** Debe ser exactamente el total del pedido. */
  monto: number;
  numeroOperacion: string | null;
  tipoEntrega: TipoEntrega;
  direccionEntrega: string | null;
}

export interface ComprobanteRequest {
  tipo: TipoComprobante;
  documentoCliente: string;
  razonSocial: string | null;
}

export interface FiltroPedidos {
  estado?: EstadoPedido | null;
  clienteId?: number | null;
  desde?: string | null;
  hasta?: string | null;
}