import { Rol } from '../core/models/auth.model';
import { PERMISOS } from '../core/permisos';

export interface OpcionMenu {
  etiqueta: string;
  icono: string;
  ruta: string;
  roles: Rol[];
}

export const MENU: OpcionMenu[] = [
  { etiqueta: 'Dashboard', icono: 'bi-speedometer2', ruta: '/dashboard', roles: PERMISOS.dashboard },
  { etiqueta: 'Cotizaciones', icono: 'bi-file-earmark-text', ruta: '/cotizaciones', roles: PERMISOS.cotizaciones },
  { etiqueta: 'Pedidos / Caja', icono: 'bi-cash-coin', ruta: '/pedidos', roles: PERMISOS.pedidos },
  { etiqueta: 'Despachos', icono: 'bi-truck', ruta: '/despachos', roles: PERMISOS.despachos },
  { etiqueta: 'Productos', icono: 'bi-box-seam', ruta: '/productos', roles: PERMISOS.productos },
  { etiqueta: 'Categorías', icono: 'bi-tags', ruta: '/categorias', roles: PERMISOS.categorias },
  { etiqueta: 'Stock', icono: 'bi-boxes', ruta: '/stock', roles: PERMISOS.stock },
  { etiqueta: 'Clientes', icono: 'bi-people', ruta: '/clientes', roles: PERMISOS.clientes },
  { etiqueta: 'Usuarios', icono: 'bi-person-gear', ruta: '/usuarios', roles: PERMISOS.usuarios }
];