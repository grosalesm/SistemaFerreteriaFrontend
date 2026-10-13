export interface Notificacion {
  idNotificacion: number;
  /** cotizacion.enviada, venta.pagada, stock.critico, ... */
  tipo: string;
  titulo: string;
  mensaje: string;
  rolDestino: string | null;
  clienteId: number | null;
  /** id de la cotización, del pedido o del producto según el tipo */
  referenciaId: number | null;
  leida: boolean;
  fecha: string;
}