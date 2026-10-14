import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastService } from '../shared/toast/toast.service';
import { NOMBRE_ROL } from '../core/permisos';
import { AuthService } from '../core/services/auth.service';
import { WsService } from '../core/services/ws.service';
import { CampanaComponent } from './campana/campana.component';
import { MENU, OpcionMenu } from './menu';

/** Estructura de las pantallas internas: sidebar según rol + navbar + contenido. */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CampanaComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private ws = inject(WsService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  menuAbierto = false;
  opciones: OpcionMenu[] = MENU.filter((o) => this.auth.tieneRol(o.roles));

  /** Al entrar a la parte interna se abre el WebSocket; cada aviso nuevo se muestra como toast. */
  ngOnInit(): void {
    this.ws.avisos$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((aviso) => this.toast.info(aviso.mensaje, aviso.titulo));
    this.ws.conectar();
  }

  get nombreRol(): string {
    return this.auth.rol ? NOMBRE_ROL[this.auth.rol] : '';
  }

  get iniciales(): string {
    return this.auth.nombreCompleto
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase();
  }

  cerrarSesion(): void {
    this.auth.logout();
  }

  ngOnDestroy(): void {
    this.ws.desconectar();
  }
}