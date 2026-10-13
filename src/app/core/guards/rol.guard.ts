import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

/**
 * Lee los roles permitidos de la ruta (data: { roles: [...] }).
 * El ADMIN pasa siempre.
 */
export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const roles = route.data['roles'] as Rol[] | undefined;

  // Una ruta sin "roles" no está restringida (por ejemplo, la raíz que redirige).
  if (!roles || auth.tieneRol(roles)) {
    return true;
  }

  inject(ToastService).aviso('No tiene permisos para entrar a esa pantalla.');
  return inject(Router).parseUrl(auth.rutaInicio());
};