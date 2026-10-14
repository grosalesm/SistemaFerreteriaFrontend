import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rol } from '../../core/models/auth.model';
import { Usuario, UsuarioRequest } from '../../core/models/usuario.model';
import { NOMBRE_ROL } from '../../core/permisos';
import { UsuarioService } from '../../core/services/usuario.service';
import { esInvalido } from '../../shared/form.util';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastService } from '../../shared/toast/toast.service';

/** Crear o editar personal interno (ADMIN). El rol CLIENTE no se crea aquí. */
@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './usuario-form.component.html'
})
export class UsuarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private toast = inject(ToastService);

  /** null = nuevo usuario */
  @Input() usuario: Usuario | null = null;
  @Output() guardado = new EventEmitter<Usuario>();
  @Output() cerrar = new EventEmitter<void>();

  readonly roles: Rol[] = ['ADMIN', 'VENDEDOR', 'CAJERO', 'ALMACENERO'];
  readonly nombreRol = NOMBRE_ROL;

  guardando = false;
  verPassword = false;
  invalido = esInvalido;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: [''],
    rol: ['VENDEDOR' as Rol, Validators.required]
  });

  ngOnInit(): void {
    if (this.usuario) {
      this.form.patchValue({ ...this.usuario, password: '' });
    } else {
      // Al crear, la contraseña es obligatoria; al editar, vacía conserva la actual.
      this.form.controls.password.setValidators(Validators.required);
    }
  }

  get titulo(): string {
    return this.usuario ? `Editar ${this.usuario.username}` : 'Nuevo usuario';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: UsuarioRequest = {
      username: v.username.trim(),
      nombreCompleto: v.nombreCompleto.trim(),
      email: v.email.trim(),
      password: v.password || null,
      rol: v.rol
    };

    this.guardando = true;
    const peticion = this.usuario
      ? this.usuarioService.editar(this.usuario.idUsuario, datos)
      : this.usuarioService.crear(datos);

    peticion.subscribe({
      next: (usuario) => {
        this.toast.exito(this.usuario ? 'Usuario actualizado.' : `Usuario ${usuario.username} creado.`);
        this.guardado.emit(usuario);
      },
      error: () => (this.guardando = false)
    });
  }
}
