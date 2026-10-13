import { Notificacion } from './notificacion.model';

export interface ResumenDashboard {
  montoHoy: number;
  pedidosHoy: number;
  montoUltimos7Dias: number;
  pedidosUltimos7Dias: number;
  montoMes: number;
  pedidosMes: number;
  cotizacionesEnviadasMes: number;
  /** porcentaje: 60.00 = 60 % */
  tasaConversionMes: number;
  alertasStock: Notificacion[];
}

export interface VentaDia {
  fecha: string;
  monto: number;
  pedidos: number;
}

export interface TopProducto {
  idProducto: number;
  nombre: string;
  unidadesAprobadas: number;
  montoAprobado: number;
}

export interface TopCliente {
  clienteId: number;
  nombre: string;
  compras: number;
  montoComprado: number;
}