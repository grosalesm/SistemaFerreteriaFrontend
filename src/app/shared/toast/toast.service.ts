import { Injectable } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'aviso' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
  /** Líneas extra, por ejemplo los faltantes de stock. */
  detalle: string[];
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: Toast[] = [];
  private siguienteId = 1;

  exito(mensaje: string, titulo = 'Listo'): void {
    this.mostrar('exito', titulo, mensaje);
  }

  error(mensaje: string, titulo = 'Error', detalle: string[] = []): void {
    this.mostrar('error', titulo, mensaje, detalle, 8000);
  }

  aviso(mensaje: string, titulo = 'Atención'): void {
    this.mostrar('aviso', titulo, mensaje);
  }

  info(mensaje: string, titulo = 'Aviso'): void {
    this.mostrar('info', titulo, mensaje);
  }

  cerrar(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  private mostrar(tipo: TipoToast, titulo: string, mensaje: string, detalle: string[] = [], duracion = 5000): void {
    const toast: Toast = { id: this.siguienteId++, tipo, titulo, mensaje, detalle };
    this.toasts = [...this.toasts, toast];
    setTimeout(() => this.cerrar(toast.id), duracion + detalle.length * 1500);
  }
}