export type Rol = 'ADMIN' | 'VENDEDOR' | 'CAJERO' | 'ALMACENERO' | 'CLIENTE';

/** Roles que pueden usar la web (el CLIENTE usa la app Android). */
export const ROLES_INTERNOS: Rol[] = ['ADMIN', 'VENDEDOR', 'CAJERO', 'ALMACENERO'];

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  idUsuario: number;
  nombreCompleto: string;
  rol: Rol;
}