import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cotizacion, CotizacionRequest, FiltroCotizaciones, ItemRequest } from '../models/cotizacion.model';
import { crearParams } from './http-params.util';
import { SIN_TOAST_ERROR } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/api/cotizaciones`;

  listar(filtro: FiltroCotizaciones = {}): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(this.url, { params: crearParams(filtro) });
  }

  obtener(id: number): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.url}/${id}`);
  }

  /** Crea en BORRADOR. */
  crear(datos: CotizacionRequest): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(this.url, datos);
  }

  /**
   * Calcula precios sin guardar. Se llama en cada cambio del carrito,
   * por eso sus errores no se muestran como toast (la pantalla los maneja).
   */
  simular(datos: CotizacionRequest): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.url}/simular`, datos, {
      context: new HttpContext().set(SIN_TOAST_ERROR, true)
    });
  }

  /** Reemplaza todos los items (solo BORRADOR). */
  reemplazarItems(id: number, items: ItemRequest[]): Observable<Cotizacion> {
    return this.http.put<Cotizacion>(`${this.url}/${id}/items`, items);
  }

  enviar(id: number): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.url}/${id}/enviar`, null);
  }

  /** Puede responder 409 con la lista de faltantes de stock. */
  aprobar(id: number): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.url}/${id}/aprobar`, null);
  }

  rechazar(id: number, motivo: string): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.url}/${id}/rechazar`, { motivo });
  }

  /** Copia una VENCIDA/RECHAZADA como nuevo BORRADOR con precios actuales. */
  reenviar(id: number): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.url}/${id}/reenviar`, null);
  }

  duplicar(id: number): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.url}/${id}/duplicar`, null);
  }
}