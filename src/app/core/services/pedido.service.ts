import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comprobante, ComprobanteRequest, FiltroPedidos, PagoRequest, Pedido } from '../models/pedido.model';
import { crearParams } from './http-params.util';

/** ms-ventas: pedidos, caja y despachos. Los pedidos nacen al aprobar una cotización. */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/api/pedidos`;

  listar(filtro: FiltroPedidos = {}): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.url, { params: crearParams(filtro) });
  }

  listarPorCliente(clienteId: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.url}/cliente/${clienteId}`);
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.url}/${id}`);
  }

  // --- Caja ---

  registrarPago(id: number, datos: PagoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.url}/${id}/pago`, datos);
  }

  emitirComprobante(id: number, datos: ComprobanteRequest): Observable<Comprobante> {
    return this.http.post<Comprobante>(`${this.url}/${id}/comprobante`, datos);
  }

  obtenerComprobante(id: number): Observable<Comprobante> {
    return this.http.get<Comprobante>(`${this.url}/${id}/comprobante`);
  }

  anular(id: number, motivo: string): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.url}/${id}/anular`, { motivo });
  }

  // --- Despachos ---

  /** Pedidos PAGADO y EN_PREPARACION. */
  despachosPendientes(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${environment.apiUrl}/api/despachos/pendientes`);
  }

  preparar(id: number): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.url}/${id}/preparar`, null);
  }

  marcarPreparados(id: number, itemsPreparados: number[]): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.url}/${id}/checklist`, { itemsPreparados });
  }

  /** repartidor es obligatorio si el pedido es DELIVERY. */
  despachar(id: number, repartidor: string | null): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.url}/${id}/despachar`, { repartidor });
  }

  entregar(id: number): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.url}/${id}/entregar`, null);
  }
}