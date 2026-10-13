import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
export class LayoutComponent implements OnDestroy {
  auth = inject(AuthService);
  private ws = inject(WsService);

  menuAbierto = false;
  opciones: OpcionMenu[] = MENU.filter((o) => this.auth.tieneRol(o.roles));

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