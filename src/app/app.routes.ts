import { Routes } from '@angular/router';
import { authGuard, inicioGuard, invitadoGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';
import { PERMISOS } from './core/permisos';
import { LayoutComponent } from './layout/layout.component';

// Mientras se construyen las fases, los módulos apuntan a un marcador temporal.
const enConstruccion = () =>
  import('./features/en-construccion/en-construccion.component').then((m) => m.EnConstruccionComponent);

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
      { path: 'dashboard', loadComponent: enConstruccion, data: { roles: PERMISOS.dashboard, titulo: 'Dashboard' } },
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
      { path: 'pedidos', loadComponent: enConstruccion, data: { roles: PERMISOS.pedidos, titulo: 'Pedidos / Caja' } },
      { path: 'despachos', loadComponent: enConstruccion, data: { roles: PERMISOS.despachos, titulo: 'Despachos' } },
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
      { path: 'usuarios', loadComponent: enConstruccion, data: { roles: PERMISOS.usuarios, titulo: 'Usuarios' } }
    ]
  },
  { path: '**', redirectTo: '' }
];