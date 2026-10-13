import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ROLES_INTERNOS } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  enviando = false;
  verPassword = false;
  /** Mensaje dentro de la tarjeta (credenciales o rol CLIENTE). */
  mensaje = '';

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.mensaje = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (respuesta) => {
        this.enviando = false;
        if (!ROLES_INTERNOS.includes(respuesta.rol)) {
          this.mensaje = 'Los clientes usan la app móvil.';
          return;
        }
        this.router.navigateByUrl(this.auth.rutaInicio());
      },
      error: (error: HttpErrorResponse) => {
        this.enviando = false;
        // 401 y 403 llegan con el motivo exacto (credenciales o usuario inactivo).
        if (error.status === 401 || error.status === 403) {
          this.mensaje = error.error?.mensaje ?? 'Usuario o contraseña incorrectos';
        }
      }
    });
  }

  invalido(campo: 'username' | 'password'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}