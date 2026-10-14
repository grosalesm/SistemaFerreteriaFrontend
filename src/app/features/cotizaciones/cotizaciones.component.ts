import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cotizacion, EstadoCotizacion, FiltroCotizaciones } from '../../core/models/cotizacion.model';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { TablaPaginadaComponent } from '../../shared/tabla-paginada/tabla-paginada.component';

@Component({
  selector: 'app-cotizaciones',
  imports: [FormsModule, RouterLink, BadgeEstadoComponent, FechaPipe, MonedaPipe, TablaPaginadaComponent],
  templateUrl: './cotizaciones.component.html'
})
export class CotizacionesComponent implements OnInit {
  private cotizacionService = inject(CotizacionService);

  readonly estados: EstadoCotizacion[] = ['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'CONVERTIDA'];

  cotizaciones: Cotizacion[] = [];
  cargando = true;
  filtro: FiltroCotizaciones = { estado: null, desde: null, hasta: null };

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.cargando = true;
    this.cotizacionService.listar(this.filtro).subscribe({
      next: (lista) => {
        // Lo más reciente primero
        this.cotizaciones = lista.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  limpiar(): void {
    this.filtro = { estado: null, desde: null, hasta: null };
    this.buscar();
  }
}
