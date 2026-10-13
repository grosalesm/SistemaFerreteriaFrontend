import { Rol } from './auth.model';

export interface Usuario {
  idUsuario: number;
  username: string;
  nombreCompleto: string;
  email: string;
  rol: Rol;
  clienteId: number | null;
  activo: boolean;
  fechaCreacion: string;
}

/** password: obligatoria al crear; al editar, vacía o null conserva la actual. */
export interface UsuarioRequest {
  username: string;
  nombreCompleto: string;
  email: string;
  password: string | null;
  rol: Rol;
}