/** Faltante que llega en el 409 al aprobar una cotización. */
export interface Faltante {
  idProducto: number;
  nombre: string;
  solicitado: number;
  disponible: number;
}

/** Cuerpo de error de los microservicios y del gateway. */
export interface ApiError {
  status: number;
  mensaje?: string;
  fecha?: string;
  faltantes?: Faltante[];
  /** Solo en el 503 del gateway */
  servicio?: string;
  error?: string;
}