import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cliente, TipoCliente } from '../../core/models/cliente.model';
import { AuthService } from '../../core/services/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { confirmar } from '../../shared/confirmar';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ClienteFormComponent } from './cliente-form.component';

/** Clientes (ADMIN, VENDEDOR). Cambiar tipo y activar/desactivar: solo ADMIN. */
@Component({
  selector: 'app-clientes',
  imports: [FormsModule, RouterLink, TablaPaginadaComponent, ClienteFormComponent],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private toast = inject(ToastService);

  esAdmin = inject(AuthService).tieneRol(['ADMIN']);

  clientes: Cliente[] = [];
  cargando = true;
  texto = '';
  tipoCliente: TipoCliente | null = null;

  /** Modal: undefined = cerrado, null = nuevo, Cliente = editar */
  editando: Cliente | null | undefined = undefined;

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.cargando = true;
    this.clienteService.listar(this.tipoCliente, this.texto.trim()).subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  claseFila = (c: Cliente): string => (c.activo ? '' : 'table-secondary text-muted');

  async cambiarTipo(cliente: Cliente): Promise<void> {
    const nuevo: TipoCliente = cliente.tipoCliente === 'CONTRATISTA' ? 'MINORISTA' : 'CONTRATISTA';
    if (nuevo === 'CONTRATISTA' && cliente.tipoDocumento !== 'RUC') {
      this.toast.aviso('Solo un cliente con RUC puede ser CONTRATISTA.');
      return;
    }
    const ok = await confirmar(
      `¿Cambiar a ${nuevo}?`,
      nuevo === 'CONTRATISTA'
        ? `${cliente.nombreRazonSocial} cotizará con precio contratista.`
        : `${cliente.nombreRazonSocial} volverá a cotizar con precio minorista.`,
      'Sí, cambiar'
    );
    if (!ok) {
      return;
    }
    this.clienteService.cambiarTipo(cliente.idCliente, nuevo).subscribe(() => {
      this.toast.exito(`Cliente cambiado a ${nuevo}.`);
      this.buscar();
    });
  }

  async cambiarEstado(cliente: Cliente): Promise<void> {
    const activar = !cliente.activo;
    const ok = await confirmar(
      activar ? '¿Activar cliente?' : '¿Desactivar cliente?',
      activar
        ? `${cliente.nombreRazonSocial} podrá volver a cotizar.`
        : `${cliente.nombreRazonSocial} no podrá generar nuevas cotizaciones.`,
      activar ? 'Sí, activar' : 'Sí, desactivar',
      !activar
    );
    if (!ok) {
      return;
    }
    this.clienteService.cambiarEstado(cliente.idCliente, activar).subscribe(() => {
      this.toast.exito(activar ? 'Cliente activado.' : 'Cliente desactivado.');
      this.buscar();
    });
  }

  alGuardar(): void {
    this.editando = undefined;
    this.buscar();
  }
}
