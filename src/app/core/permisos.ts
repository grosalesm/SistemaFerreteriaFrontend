import { Rol } from './models/auth.model';

/**
 * Roles que pueden entrar a cada pantalla. Lo usan las rutas (rolGuard) y el menú.
 * El ADMIN entra a todo aunque no esté en la lista.
 */
export const PERMISOS = {
  dashboard: ['ADMIN'],
  cotizaciones: ['VENDEDOR'],
  pedidos: ['VENDEDOR', 'CAJERO'],
  despachos: ['ALMACENERO'],
  productos: ['VENDEDOR', 'ALMACENERO'],
  categorias: ['ADMIN'],
  stock: ['VENDEDOR', 'ALMACENERO'],
  clientes: ['VENDEDOR'],
  usuarios: ['ADMIN']
} satisfies Record<string, Rol[]>;

export const NOMBRE_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  CAJERO: 'Cajero',
  ALMACENERO: 'Almacenero',
  CLIENTE: 'Cliente'
};