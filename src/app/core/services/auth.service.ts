import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Rol, ROLES_INTERNOS } from '../models/auth.model';
import { Usuario } from '../models/usuario.model';

const CLAVE_TOKEN = 'token';
const CLAVE_ID = 'idUsuario';
const CLAVE_NOMBRE = 'nombreCompleto';
const CLAVE_ROL = 'rol';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private url = `${environment.apiUrl}/api/auth`;

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login`, datos).pipe(
      tap((respuesta) => {
        // El CLIENTE usa la app Android: no se guarda su sesión en la web.
        if (ROLES_INTERNOS.includes(respuesta.rol)) {
          this.guardarSesion(respuesta);
        }
      })
    );
  }

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/me`);
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_ID);
    localStorage.removeItem(CLAVE_NOMBRE);
    localStorage.removeItem(CLAVE_ROL);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  get idUsuario(): number | null {
    const id = localStorage.getItem(CLAVE_ID);
    return id ? Number(id) : null;
  }

  get nombreCompleto(): string {
    return localStorage.getItem(CLAVE_NOMBRE) ?? '';
  }

  get rol(): Rol | null {
    return localStorage.getItem(CLAVE_ROL) as Rol | null;
  }

  /** Hay token, no expiró y el rol es interno. */
  estaAutenticado(): boolean {
    const token = this.token;
    if (!token || !this.rol || !ROLES_INTERNOS.includes(this.rol)) {
      return false;
    }
    return !this.tokenExpirado(token);
  }

  /** El ADMIN puede entrar a todo. */
  tieneRol(roles: Rol[]): boolean {
    const rol = this.rol;
    return rol === 'ADMIN' || (rol !== null && roles.includes(rol));
  }

  /** Pantalla inicial según el rol. */
  rutaInicio(): string {
    switch (this.rol) {
      case 'ADMIN':
        return '/dashboard';
      case 'VENDEDOR':
        return '/cotizaciones';
      case 'CAJERO':
        return '/pedidos';
      case 'ALMACENERO':
        return '/despachos';
      default:
        return '/login';
    }
  }

  private guardarSesion(respuesta: LoginResponse): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_ID, String(respuesta.idUsuario));
    localStorage.setItem(CLAVE_NOMBRE, respuesta.nombreCompleto);
    localStorage.setItem(CLAVE_ROL, respuesta.rol);
  }

  /** Lee el claim "exp" (segundos) del JWT. */
  private tokenExpirado(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !payload.exp || payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}