import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, ClienteRequest, TipoCliente } from '../models/cliente.model';
import { crearParams } from './http-params.util';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/api/clientes`;

  /** texto busca por nombre o documento. */
  listar(tipoCliente?: TipoCliente | null, texto?: string | null): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.url, { params: crearParams({ tipoCliente, texto }) });
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.url}/${id}`);
  }

  crear(datos: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.url, datos);
  }

  editar(id: number, datos: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.url}/${id}`, datos);
  }

  /** Solo un cliente con RUC puede ser CONTRATISTA. */
  cambiarTipo(id: number, tipoCliente: TipoCliente): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.url}/${id}/tipo`, null, { params: { tipoCliente } });
  }

  cambiarEstado(id: number, activo: boolean): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.url}/${id}/estado`, null, { params: { activo } });
  }
}