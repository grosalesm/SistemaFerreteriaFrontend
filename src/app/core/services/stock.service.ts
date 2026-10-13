import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AjusteRequest, IngresoRequest, Movimiento, Stock } from '../models/stock.model';
import { crearParams } from './http-params.util';

/** ms-productos: stock por almacén y kardex. */
@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/api/stock`;

  listar(idAlmacen?: number | null): Observable<Stock[]> {
    return this.http.get<Stock[]>(this.url, { params: crearParams({ idAlmacen }) });
  }

  /** Stock con disponible ≤ stock mínimo. */
  criticos(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.url}/criticos`);
  }

  ajustar(datos: AjusteRequest): Observable<Stock> {
    return this.http.post<Stock>(`${this.url}/ajustes`, datos);
  }

  ingresar(datos: IngresoRequest): Observable<Stock> {
    return this.http.post<Stock>(`${this.url}/ingresos`, datos);
  }

  kardex(idProducto: number): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${environment.apiUrl}/api/productos/${idProducto}/kardex`);
  }
}