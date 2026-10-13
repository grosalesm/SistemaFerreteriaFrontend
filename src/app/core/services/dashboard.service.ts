import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResumenDashboard, TopCliente, TopProducto, VentaDia } from '../models/dashboard.model';

/** ms-notificaciones: KPIs del dashboard (solo ADMIN). */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/api/dashboard`;

  resumen(): Observable<ResumenDashboard> {
    return this.http.get<ResumenDashboard>(`${this.url}/resumen`);
  }

  /** desde / hasta en formato yyyy-MM-dd. */
  ventas(desde: string, hasta: string): Observable<VentaDia[]> {
    return this.http.get<VentaDia[]>(`${this.url}/ventas`, { params: { desde, hasta } });
  }

  topProductos(): Observable<TopProducto[]> {
    return this.http.get<TopProducto[]>(`${this.url}/top-productos`);
  }

  topClientes(): Observable<TopCliente[]> {
    return this.http.get<TopCliente[]>(`${this.url}/top-clientes`);
  }
}