import { Injectable, NgZone, inject } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacion } from '../models/notificacion.model';
import { AuthService } from './auth.service';

/**
 * Avisos en tiempo real: STOMP sobre WebSocket nativo a través del gateway.
 * El token va en el query param ?token= porque el navegador no envía cabeceras en un WebSocket.
 */
@Injectable({ providedIn: 'root' })
export class WsService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);

  private cliente: Client | null = null;
  private avisosSubject = new Subject<Notificacion>();

  /** Cada NotificacionResponse que llega por el tópico del rol. */
  readonly avisos$: Observable<Notificacion> = this.avisosSubject.asObservable();

  conectar(): void {
    const token = this.auth.token;
    const rol = this.auth.rol;
    if (this.cliente || !token || !rol) {
      return;
    }

    const topico = `/topic/rol/${rol}`;

    this.cliente = new Client({
      brokerURL: `${environment.wsUrl}?token=${encodeURIComponent(token)}`,
      reconnectDelay: 5000,
      onConnect: () => {
        this.cliente?.subscribe(topico, (mensaje) => {
          const aviso: Notificacion = JSON.parse(mensaje.body);
          // stompjs corre fuera de Angular: volvemos a la zona para refrescar la vista.
          this.zone.run(() => this.avisosSubject.next(aviso));
        });
      },
      onStompError: (frame) => console.error('STOMP:', frame.headers['message']),
      // Si el token expiró la reconexión no tiene sentido.
      beforeConnect: async () => {
        if (!this.auth.estaAutenticado()) {
          await this.desconectar();
        }
      }
    });

    this.cliente.activate();
  }

  async desconectar(): Promise<void> {
    const cliente = this.cliente;
    this.cliente = null;
    if (cliente) {
      await cliente.deactivate();
    }
  }
}