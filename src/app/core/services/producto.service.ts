import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Almacen, Categoria, FiltroProductos, Producto, ProductoRequest } from '../models/producto.model';
import { crearParams } from './http-params.util';

/** ms-productos: catálogo, categorías y almacenes. */
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  listar(filtro: FiltroProductos = {}): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.api}/api/productos`, { params: crearParams(filtro) });
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.api}/api/productos/${id}`);
  }

  crear(datos: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.api}/api/productos`, datos);
  }

  editar(id: number, datos: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.api}/api/productos/${id}`, datos);
  }

  cambiarEstado(id: number, activo: boolean): Observable<Producto> {
    return this.http.patch<Producto>(`${this.api}/api/productos/${id}/estado`, null, { params: { activo } });
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.api}/api/categorias`);
  }

  crearCategoria(nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.api}/api/categorias`, { nombre });
  }

  listarAlmacenes(): Observable<Almacen[]> {
    return this.http.get<Almacen[]>(`${this.api}/api/almacenes`);
  }
}