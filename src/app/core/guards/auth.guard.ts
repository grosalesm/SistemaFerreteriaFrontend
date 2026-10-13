import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Deja pasar solo si hay sesión válida de un rol interno. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.estaAutenticado()) {
    return true;
  }
  auth.logout();
  return false;
};

/** Para la raíz "/": redirige a la pantalla inicial del rol. */
export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).parseUrl(auth.rutaInicio());
};

/** Para el login: si ya hay sesión, va directo a la pantalla inicial del rol. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estaAutenticado() ? inject(Router).parseUrl(auth.rutaInicio()) : true;
};