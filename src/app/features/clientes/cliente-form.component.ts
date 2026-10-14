import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente, ClienteRequest, TipoDocumento } from '../../core/models/cliente.model';
import { ClienteService } from '../../core/services/cliente.service';
import { esInvalido } from '../../shared/form.util';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastService } from '../../shared/toast/toast.service';

/** DNI: 8 dígitos. RUC: 11 dígitos. */
const PATRON_DOCUMENTO: Record<TipoDocumento, RegExp> = {
  DNI: /^\d{8}$/,
  RUC: /^\d{11}$/
};

/** Modal para crear o editar un cliente (ADMIN, VENDEDOR). */
@Component({
  selector: 'app-cliente-form',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './cliente-form.component.html'
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private toast = inject(ToastService);

  /** null = nuevo cliente */
  @Input() cliente: Cliente | null = null;
  @Output() guardado = new EventEmitter<Cliente>();
  @Output() cerrar = new EventEmitter<void>();

  guardando = false;
  invalido = esInvalido;

  form = this.fb.nonNullable.group({
    tipoDocumento: ['DNI' as TipoDocumento, Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern(PATRON_DOCUMENTO.DNI)]],
    nombreRazonSocial: ['', [Validators.required, Validators.maxLength(150)]],
    telefono: ['', Validators.maxLength(20)],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    direccion: ['', Validators.maxLength(200)]
  });

  ngOnInit(): void {
    if (this.cliente) {
      this.form.patchValue({
        tipoDocumento: this.cliente.tipoDocumento,
        numeroDocumento: this.cliente.numeroDocumento,
        nombreRazonSocial: this.cliente.nombreRazonSocial,
        telefono: this.cliente.telefono ?? '',
        email: this.cliente.email ?? '',
        direccion: this.cliente.direccion ?? ''
      });
      this.actualizarPatron(this.cliente.tipoDocumento);
    }

    // Al cambiar DNI/RUC cambia la cantidad de dígitos exigida.
    this.form.controls.tipoDocumento.valueChanges.subscribe((tipo) => this.actualizarPatron(tipo));
  }

  get titulo(): string {
    return this.cliente ? 'Editar cliente' : 'Nuevo cliente';
  }

  get esRuc(): boolean {
    return this.form.controls.tipoDocumento.value === 'RUC';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const datos: ClienteRequest = {
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento.trim(),
      nombreRazonSocial: v.nombreRazonSocial.trim(),
      telefono: v.telefono.trim() || null,
      email: v.email.trim() || null,
      direccion: v.direccion.trim() || null
    };

    this.guardando = true;
    const peticion = this.cliente
      ? this.clienteService.editar(this.cliente.idCliente, datos)
      : this.clienteService.crear(datos);

    peticion.subscribe({
      next: (cliente) => {
        this.toast.exito(this.cliente ? 'Cliente actualizado.' : 'Cliente registrado.');
        this.guardado.emit(cliente);
      },
      error: () => (this.guardando = false)
    });
  }

  private actualizarPatron(tipo: TipoDocumento): void {
    const control = this.form.controls.numeroDocumento;
    control.setValidators([Validators.required, Validators.pattern(PATRON_DOCUMENTO[tipo])]);
    control.updateValueAndValidity();
  }
}
