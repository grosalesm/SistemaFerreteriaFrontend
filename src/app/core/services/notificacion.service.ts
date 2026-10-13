import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacion } from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/api/notificaciones`;

  /** Notificaciones del rol del token. */
  listar(soloNoLeidas = false): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.url, { params: { soloNoLeidas } });
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.http.patch<Notificacion>(`${this.url}/${id}/leida`, null);
  }
}