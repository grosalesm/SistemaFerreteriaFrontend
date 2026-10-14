import { Routes } from '@angular/router';
import { authGuard, inicioGuard, invitadoGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';
import { PERMISOS } from './core/permisos';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [rolGuard],
    children: [
      // La raíz redirige a la pantalla inicial del rol.
      { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },
      {
        path: 'dashboard',
        data: { roles: PERMISOS.dashboard },
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'cotizaciones',
        data: { roles: PERMISOS.cotizaciones },
        loadComponent: () => import('./features/cotizaciones/cotizaciones.component').then((m) => m.CotizacionesComponent)
      },
      {
        path: 'cotizaciones/nueva',
        data: { roles: PERMISOS.cotizaciones },
        loadComponent: () =>
          import('./features/cotizaciones/cotizacion-form.component').then((m) => m.CotizacionFormComponent)
      },
      {
        path: 'cotizaciones/:id',
        data: { roles: PERMISOS.cotizaciones },
        loadComponent: () =>
          import('./features/cotizaciones/cotizacion-detalle.component').then((m) => m.CotizacionDetalleComponent)
      },
      {
        path: 'cotizaciones/:id/editar',
        data: { roles: PERMISOS.cotizaciones },
        loadComponent: () =>
          import('./features/cotizaciones/cotizacion-form.component').then((m) => m.CotizacionFormComponent)
      },
      {
        path: 'pedidos',
        data: { roles: PERMISOS.pedidos },
        loadComponent: () => import('./features/pedidos/pedidos.component').then((m) => m.PedidosComponent)
      },
      {
        path: 'pedidos/:id',
        data: { roles: PERMISOS.pedidos },
        loadComponent: () => import('./features/pedidos/pedido-detalle.component').then((m) => m.PedidoDetalleComponent)
      },
      {
        path: 'despachos',
        data: { roles: PERMISOS.despachos },
        loadComponent: () => import('./features/despachos/despachos.component').then((m) => m.DespachosComponent)
      },
      {
        path: 'productos',
        data: { roles: PERMISOS.productos },
        loadComponent: () => import('./features/productos/productos.component').then((m) => m.ProductosComponent)
      },
      {
        path: 'categorias',
        data: { roles: PERMISOS.categorias },
        loadComponent: () => import('./features/categorias/categorias.component').then((m) => m.CategoriasComponent)
      },
      {
        path: 'stock',
        data: { roles: PERMISOS.stock },
        loadComponent: () => import('./features/stock/stock.component').then((m) => m.StockComponent)
      },
      {
        path: 'stock/kardex/:idProducto',
        data: { roles: PERMISOS.kardex },
        loadComponent: () => import('./features/stock/kardex.component').then((m) => m.KardexComponent)
      },
      {
        path: 'clientes',
        data: { roles: PERMISOS.clientes },
        loadComponent: () => import('./features/clientes/clientes.component').then((m) => m.ClientesComponent)
      },
      {
        path: 'clientes/:id',
        data: { roles: PERMISOS.clientes },
        loadComponent: () =>
          import('./features/clientes/cliente-detalle.component').then((m) => m.ClienteDetalleComponent)
      },
      {
        path: 'usuarios',
        data: { roles: PERMISOS.usuarios },
        loadComponent: () => import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];