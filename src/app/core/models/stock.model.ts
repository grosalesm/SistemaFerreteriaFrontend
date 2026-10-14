export interface Stock {
  idStock: number;
  idProducto: number;
  idAlmacen: number;
  cantidadFisica: number;
  cantidadReservada: number;
  disponible: number;
  /** Viene en GET /api/stock y /criticos; null en respuestas de ingreso / ajuste. */
  productoActivo: boolean | null;
}

/** Fija la cantidad física (inventario). No puede ser menor a la reservada. */
export interface AjusteRequest {
  idProducto: number;
  idAlmacen: number;
  nuevaCantidad: number;
  motivo: string;
}

/** Suma unidades (compra / reposición). */
export interface IngresoRequest {
  idProducto: number;
  idAlmacen: number;
  cantidad: number;
}

export type TipoMovimiento = 'INGRESO' | 'AJUSTE' | 'RESERVA' | 'LIBERACION' | 'SALIDA_VENTA';

export interface Movimiento {
  idMovimiento: number;
  idProducto: number;
  idAlmacen: number;
  tipo: TipoMovimiento;
  cantidad: number;
  saldoFisico: number;
  referencia: string | null;
  fecha: string;
}