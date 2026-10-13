import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiError } from '../models/api-error.model';
import { AuthService } from '../services/auth.service';

/** Marca una petición para que sus errores no se muestren como toast (la pantalla los maneja). */
export const SIN_TOAST_ERROR = new HttpContextToken<boolean>(() => false);

/**
 * - 401: cierra sesión y vuelve al login (salvo en el propio login, que muestra el mensaje).
 * - 409 con faltantes: los lista producto por producto.
 * - 503: el servicio del gateway no está disponible.
 * - Otros: muestra el "mensaje" del JSON de error.
 * El error se vuelve a lanzar para que el componente pueda reaccionar.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLogin = req.url.endsWith('/api/auth/login');
      const cuerpo: ApiError | null = typeof error.error === 'object' ? error.error : null;

      if (error.status === 401 && !esLogin) {
        auth.logout();
        toast.aviso('Su sesión expiró, ingrese nuevamente.', 'Sesión');
        return throwError(() => error);
      }

      // En el login, credenciales incorrectas o usuario inactivo se muestran dentro del formulario.
      const credencialesLogin = esLogin && (error.status === 401 || error.status === 403);

      if (req.context.get(SIN_TOAST_ERROR) || credencialesLogin) {
        return throwError(() => error);
      }

      if (error.status === 0) {
        toast.error('No se pudo conectar con el servidor. Verifique que el API Gateway esté encendido.');
      } else if (error.status === 503) {
        const servicio = cuerpo?.servicio ?? 'solicitado';
        toast.error(`El servicio ${servicio} no está disponible, intente en unos segundos.`, 'Servicio no disponible');
      } else if (error.status === 409 && cuerpo?.faltantes?.length) {
        const detalle = cuerpo.faltantes.map(
          (f) => `${f.nombre}: solicitado ${f.solicitado}, disponible ${f.disponible}`
        );
        toast.error(cuerpo.mensaje ?? 'Stock insuficiente', 'Stock insuficiente', detalle);
      } else if (error.status === 404 && !cuerpo?.mensaje) {
        toast.error('El registro solicitado no existe.');
      } else {
        toast.error(cuerpo?.mensaje ?? 'Ocurrió un error inesperado.');
      }

      return throwError(() => error);
    })
  );
};