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
      { path: 'cotizaciones', loadComponent: enConstruccion, data: { roles: PERMISOS.cotizaciones, titulo: 'Cotizaciones' } },
      { path: 'pedidos', loadComponent: enConstruccion, data: { roles: PERMISOS.pedidos, titulo: 'Pedidos / Caja' } },
      { path: 'despachos', loadComponent: enConstruccion, data: { roles: PERMISOS.despachos, titulo: 'Despachos' } },
      { path: 'productos', loadComponent: enConstruccion, data: { roles: PERMISOS.productos, titulo: 'Productos' } },
      { path: 'categorias', loadComponent: enConstruccion, data: { roles: PERMISOS.categorias, titulo: 'Categorías' } },
      { path: 'stock', loadComponent: enConstruccion, data: { roles: PERMISOS.stock, titulo: 'Stock' } },
      { path: 'clientes', loadComponent: enConstruccion, data: { roles: PERMISOS.clientes, titulo: 'Clientes' } },
      { path: 'usuarios', loadComponent: enConstruccion, data: { roles: PERMISOS.usuarios, titulo: 'Usuarios' } }
    ]
  },
  { path: '**', redirectTo: '' }
];