export type TipoDocumento = 'DNI' | 'RUC';
export type TipoCliente = 'MINORISTA' | 'CONTRATISTA';

export interface Cliente {
  idCliente: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreRazonSocial: string;
  tipoCliente: TipoCliente;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
  fechaRegistro: string;
}

export interface ClienteRequest {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreRazonSocial: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}