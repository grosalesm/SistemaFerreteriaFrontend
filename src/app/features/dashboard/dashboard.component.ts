import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { forkJoin } from 'rxjs';
import { ResumenDashboard, TopCliente, TopProducto, VentaDia } from '../../core/models/dashboard.model';
import { Notificacion } from '../../core/models/notificacion.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { WsService } from '../../core/services/ws.service';
import { FechaPipe, formatearFecha } from '../../shared/pipes/fecha.pipe';
import { MonedaPipe, formatearMoneda } from '../../shared/pipes/moneda.pipe';

const DIAS_GRAFICO = 30;
/** Naranja oscuro: el de acento (#f57c00) no llega a 3:1 de contraste sobre blanco. */
const COLOR_LINEA = '#d96c00';

/** yyyy-MM-dd en hora local. */
function aIso(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** Dashboard del ADMIN: KPIs, ventas de 30 días, tops, alertas de stock y avisos en vivo. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FechaPipe, MonedaPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private ws = inject(WsService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('lienzo') lienzo!: ElementRef<HTMLCanvasElement>;
  private grafico: Chart | null = null;

  resumen: ResumenDashboard | null = null;
  ventas: VentaDia[] = [];
  topProductos: TopProducto[] = [];
  topClientes: TopCliente[] = [];
  cargando = true;
  verTabla = false;

  /** Avisos recibidos por WebSocket mientras la pantalla está abierta (el más nuevo arriba). */
  enVivo: Notificacion[] = [];

  ngAfterViewInit(): void {
    this.cargar();

    this.ws.avisos$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((aviso) => {
      this.enVivo = [aviso, ...this.enVivo].slice(0, 20);
      // Un pago o una anulación cambian los montos; un stock crítico, las alertas.
      if (aviso.tipo.startsWith('venta.') || aviso.tipo === 'stock.critico') {
        this.cargarResumen();
      }
    });
  }

  ngOnDestroy(): void {
    this.grafico?.destroy();
  }

  cargar(): void {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - (DIAS_GRAFICO - 1));

    this.cargando = true;
    forkJoin({
      resumen: this.dashboardService.resumen(),
      ventas: this.dashboardService.ventas(aIso(desde), aIso(hoy)),
      productos: this.dashboardService.topProductos(),
      clientes: this.dashboardService.topClientes()
    }).subscribe({
      next: ({ resumen, ventas, productos, clientes }) => {
        this.resumen = resumen;
        this.ventas = this.completarDias(ventas, desde);
        this.topProductos = productos.slice(0, 5);
        this.topClientes = clientes.slice(0, 5);
        this.cargando = false;
        this.dibujarGrafico();
      },
      error: () => (this.cargando = false)
    });
  }

  private cargarResumen(): void {
    this.dashboardService.resumen().subscribe((r) => (this.resumen = r));
  }

  get totalPeriodo(): number {
    return this.ventas.reduce((s, v) => s + v.monto, 0);
  }

  get pedidosPeriodo(): number {
    return this.ventas.reduce((s, v) => s + v.pedidos, 0);
  }

  /** Ancho de la barra de los tops, relativo al primero. */
  porcentaje(valor: number, maximo: number): number {
    return maximo > 0 ? (valor / maximo) * 100 : 0;
  }

  /** La API solo devuelve los días con ventas: los demás se completan con 0. */
  private completarDias(ventas: VentaDia[], desde: Date): VentaDia[] {
    const porFecha = new Map(ventas.map((v) => [v.fecha, v]));
    return Array.from({ length: DIAS_GRAFICO }, (_, i) => {
      const dia = new Date(desde);
      dia.setDate(desde.getDate() + i);
      const iso = aIso(dia);
      return porFecha.get(iso) ?? { fecha: iso, monto: 0, pedidos: 0 };
    });
  }

  private dibujarGrafico(): void {
    this.grafico?.destroy();
    const ventas = this.ventas;

    this.grafico = new Chart(this.lienzo.nativeElement, {
      type: 'line',
      data: {
        labels: ventas.map((v) => formatearFecha(v.fecha, true).slice(0, 5)), // dd/MM
        datasets: [
          {
            label: 'Ventas',
            data: ventas.map((v) => v.monto),
            borderColor: COLOR_LINEA,
            backgroundColor: 'rgba(245, 124, 0, 0.08)',
            borderWidth: 2,
            fill: true,
            tension: 0.25,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: COLOR_LINEA,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Tooltip con solo pasar por la columna del día (no hace falta acertar al punto).
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2329',
            padding: 10,
            displayColors: false,
            callbacks: {
              title: (items) => formatearFecha(ventas[items[0].dataIndex].fecha, true),
              label: (item) => formatearMoneda(item.parsed.y ?? 0),
              afterLabel: (item) => `${ventas[item.dataIndex].pedidos} pedido(s)`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6c757d', maxTicksLimit: 10, maxRotation: 0 }
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#eef0f2' },
            ticks: { color: '#6c757d', maxTicksLimit: 5, callback: (v) => `S/ ${Number(v).toLocaleString('en-US')}` }
          }
        }
      }
    });
  }

  icono(tipo: string): string {
    if (tipo.startsWith('cotizacion')) return 'bi-file-earmark-text text-primary';
    if (tipo.startsWith('venta')) return 'bi-cash-coin text-success';
    if (tipo.startsWith('pedido')) return 'bi-truck text-info';
    if (tipo.startsWith('stock')) return 'bi-exclamation-triangle text-danger';
    return 'bi-bell';
  }
}
