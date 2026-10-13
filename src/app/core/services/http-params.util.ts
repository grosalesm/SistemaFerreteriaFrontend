import { HttpParams } from '@angular/common/http';

/** Arma HttpParams omitiendo los valores vacíos (null, undefined o ''). */
export function crearParams(filtros: object): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== null && valor !== undefined && valor !== '') {
      params = params.set(clave, String(valor));
    }
  }
  return params;
}