import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Rol } from '../../core/models/auth.model';
import { Usuario } from '../../core/models/usuario.model';
import { NOMBRE_ROL } from '../../core/permisos';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { confirmar } from '../../shared/confirmar';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';
import { ToastService } from '../../shared/toast/toast.service';
import { UsuarioFormComponent } from './usuario-form.component';

/**
 * Usuarios (ADMIN). Se gestiona el personal interno.
 * Las cuentas CLIENTE (app Android) se pueden ver y desactivar, pero no editar.
 */
@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, FechaPipe, TablaPaginadaComponent, UsuarioFormComponent],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private toast = inject(ToastService);
  private idPropio = inject(AuthService).idUsuario;

  readonly nombreRol = NOMBRE_ROL;
  readonly colorRol: Record<Rol, string> = {
    ADMIN: 'text-bg-dark',
    VENDEDOR: 'text-bg-primary',
    CAJERO: 'text-bg-success',
    ALMACENERO: 'text-bg-info',
    CLIENTE: 'text-bg-light border'
  };

  usuarios: Usuario[] = [];
  visibles: Usuario[] = [];
  cargando = true;
  verClientes = false;

  /** Modal: undefined = cerrado, null = nuevo, Usuario = editar */
  editando: Usuario | null | undefined = undefined;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.filtrar();
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  /** Por defecto solo el personal interno; el interruptor agrega las cuentas de clientes. */
  filtrar(): void {
    this.visibles = this.verClientes ? this.usuarios : this.usuarios.filter((u) => u.rol !== 'CLIENTE');
  }

  get totalClientes(): number {
    return this.usuarios.filter((u) => u.rol === 'CLIENTE').length;
  }

  rolDe(u: Usuario): string {
    return this.nombreRol[u.rol];
  }

  colorDe(u: Usuario): string {
    return this.colorRol[u.rol];
  }

  esPropio(u: Usuario): boolean {
    return u.idUsuario === this.idPropio;
  }

  claseFila = (u: Usuario): string => (u.activo ? '' : 'table-secondary text-muted');

  async cambiarEstado(u: Usuario): Promise<void> {
    const activar = !u.activo;
    const ok = await confirmar(
      activar ? '¿Activar usuario?' : '¿Desactivar usuario?',
      activar ? `${u.nombreCompleto} podrá volver a ingresar.` : `${u.nombreCompleto} ya no podrá iniciar sesión.`,
      activar ? 'Sí, activar' : 'Sí, desactivar',
      !activar
    );
    if (!ok) return;

    this.usuarioService.cambiarEstado(u.idUsuario, activar).subscribe(() => {
      this.toast.exito(activar ? 'Usuario activado.' : 'Usuario desactivado.');
      this.cargar();
    });
  }

  alGuardar(): void {
    this.editando = undefined;
    this.cargar();
  }
}
