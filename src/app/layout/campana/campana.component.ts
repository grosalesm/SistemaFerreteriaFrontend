import { Component, OnInit, inject } from '@angular/core';
import { Notificacion } from '../../core/models/notificacion.model';
import { NotificacionService } from '../../core/services/notificacion.service';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';

/** Campana de la navbar: contador de no leídas y lista desplegable. */
@Component({
  selector: 'app-campana',
  imports: [FechaPipe],
  templateUrl: './campana.component.html',
  styleUrl: './campana.component.css'
})
export class CampanaComponent implements OnInit {
  private notificacionService = inject(NotificacionService);

  notificaciones: Notificacion[] = [];

  get noLeidas(): number {
    return this.notificaciones.filter((n) => !n.leida).length;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.notificacionService.listar().subscribe((lista) => {
      this.notificaciones = lista.sort((a, b) => b.fecha.localeCompare(a.fecha));
    });
  }

  marcarLeida(n: Notificacion): void {
    if (n.leida) {
      return;
    }
    this.notificacionService.marcarLeida(n.idNotificacion).subscribe(() => (n.leida = true));
  }

  marcarTodas(): void {
    this.notificaciones.filter((n) => !n.leida).forEach((n) => this.marcarLeida(n));
  }

  icono(tipo: string): string {
    if (tipo.startsWith('cotizacion')) return 'bi-file-earmark-text text-primary';
    if (tipo.startsWith('venta')) return 'bi-cash-coin text-success';
    if (tipo.startsWith('pedido')) return 'bi-truck text-info';
    if (tipo.startsWith('stock')) return 'bi-exclamation-triangle text-danger';
    return 'bi-bell';
  }
}