import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { Cliente } from '../../core/models/cliente.model';
import { Cotizacion, CotizacionRequest, ItemCotizacion } from '../../core/models/cotizacion.model';
import { Almacen, DisponibleAlmacen, Producto } from '../../core/models/producto.model';
import { ClienteService } from '../../core/services/cliente.service';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { ProductoService } from '../../core/services/producto.service';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { ToastService } from '../../shared/toast/toast.service';

/** Producto en el carrito. Precio, descuento y subtotal los calcula /simular. */
interface ItemCarrito {
  idProducto: number;
  sku: string;
  nombre: string;
  unidadMedida: string;
  cantidad: number;
  /** Solo se conoce si el producto se agregó desde el buscador. */
  disponiblePorAlmacen?: DisponibleAlmacen[];
}

const MAX_ITEMS = 50;

/**
 * Crear una cotización (/cotizaciones/nueva) o editar los items de un BORRADOR (/cotizaciones/:id/editar).
 * Cada cambio del carrito llama a /simular para recalcular los precios en vivo.
 */
@Component({
  selector: 'app-cotizacion-form',
  imports: [ReactiveFormsModule, RouterLink, MonedaPipe],
  templateUrl: './cotizacion-form.component.html',
  styleUrl: './cotizacion-form.component.css'
})
export class CotizacionFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cotizacionService = inject(CotizacionService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private toast = inject(ToastService);

  /** En edición: la cotización BORRADOR que se modifica. */
  editando: Cotizacion | null = null;
  cargando = false;

  // Cliente
  cliente: Cliente | null = null;
  buscarCliente = new FormControl('', { nonNullable: true });
  clientesEncontrados: Cliente[] = [];
  buscandoClientes = false;

  // Almacén
  almacenes: Almacen[] = [];
  idAlmacen = new FormControl<number>(1, { nonNullable: true });

  // Productos
  buscarProducto = new FormControl('', { nonNullable: true });
  productosEncontrados: Producto[] = [];
  buscandoProductos = false;

  // Carrito y cálculo
  carrito: ItemCarrito[] = [];
  simulacion: Cotizacion | null = null;
  simulando = false;
  errorSimulacion = '';
  private recalcular$ = new Subject<void>();

  guardando = false;

  ngOnInit(): void {
    this.productoService.listarAlmacenes().subscribe((almacenes) => (this.almacenes = almacenes));

    this.escucharBuscadores();
    this.escucharRecalculo();
    this.idAlmacen.valueChanges.subscribe(() => this.recalcular());

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarBorrador(Number(id));
    }
  }

  // ---------- Cliente ----------

  seleccionarCliente(cliente: Cliente): void {
    this.cliente = cliente;
    this.clientesEncontrados = [];
    this.buscarCliente.setValue('', { emitEvent: false });
    this.recalcular();
  }

  quitarCliente(): void {
    this.cliente = null;
    this.simulacion = null;
  }

  // ---------- Productos ----------

  /** Precio de lista según el tipo del cliente seleccionado. */
  precioLista(p: Producto): number {
    return this.cliente?.tipoCliente === 'CONTRATISTA' ? p.precioContratista : p.precioMinorista;
  }

  disponibleEnAlmacen(disponibles: DisponibleAlmacen[] | undefined): number | null {
    if (!disponibles) return null;
    return disponibles.find((d) => d.idAlmacen === this.idAlmacen.value)?.disponible ?? 0;
  }

  agregar(p: Producto): void {
    const existente = this.carrito.find((i) => i.idProducto === p.idProducto);
    if (existente) {
      existente.cantidad++;
    } else if (this.carrito.length >= MAX_ITEMS) {
      this.toast.aviso(`Una cotización admite como máximo ${MAX_ITEMS} productos.`);
      return;
    } else {
      this.carrito.push({
        idProducto: p.idProducto,
        sku: p.sku,
        nombre: p.nombre,
        unidadMedida: p.unidadMedida,
        cantidad: 1,
        disponiblePorAlmacen: p.disponiblePorAlmacen
      });
    }
    this.productosEncontrados = [];
    this.buscarProducto.setValue('', { emitEvent: false });
    this.recalcular();
  }

  /** Enter en el buscador agrega el primer resultado. */
  agregarPrimero(evento: Event): void {
    evento.preventDefault();
    if (this.productosEncontrados.length) {
      this.agregar(this.productosEncontrados[0]);
    }
  }

  cambiarCantidad(item: ItemCarrito, valor: string): void {
    item.cantidad = Math.floor(Number(valor));
    this.recalcular();
  }

  sumar(item: ItemCarrito, delta: number): void {
    item.cantidad = Math.max(1, (item.cantidad || 0) + delta);
    this.recalcular();
  }

  quitar(item: ItemCarrito): void {
    this.carrito = this.carrito.filter((i) => i !== item);
    this.recalcular();
  }

  /** Línea calculada por /simular para un producto del carrito. */
  calculado(idProducto: number): ItemCotizacion | undefined {
    return this.simulacion?.items.find((i) => i.idProducto === idProducto);
  }

  get cantidadesValidas(): boolean {
    return this.carrito.every((i) => Number.isInteger(i.cantidad) && i.cantidad > 0);
  }

  get hayAvisosStock(): boolean {
    return !!this.simulacion?.items.some((i) => i.aviso);
  }

  get puedeGuardar(): boolean {
    return !!this.cliente && this.carrito.length > 0 && this.cantidadesValidas && !this.guardando;
  }

  // ---------- Guardar ----------

  guardar(enviar: boolean): void {
    const datos = this.armarRequest();
    if (!datos || !this.cantidadesValidas) {
      return;
    }

    this.guardando = true;
    const guardado$: Observable<Cotizacion> = this.editando
      ? this.cotizacionService.reemplazarItems(this.editando.idCotizacion, datos.items)
      : this.cotizacionService.crear(datos);

    guardado$
      .pipe(switchMap((cot) => (enviar ? this.cotizacionService.enviar(cot.idCotizacion) : of(cot))))
      .subscribe({
        next: (cot) => {
          this.toast.exito(
            enviar ? `Cotización ${cot.codigo} enviada (vigente 7 días).` : `Cotización ${cot.codigo} guardada como borrador.`
          );
          this.router.navigate(['/cotizaciones', cot.idCotizacion]);
        },
        error: () => (this.guardando = false)
      });
  }

  // ---------- Internos ----------

  private recalcular(): void {
    this.recalcular$.next();
  }

  private armarRequest(): CotizacionRequest | null {
    if (!this.cliente || !this.carrito.length) {
      return null;
    }
    return {
      clienteId: this.cliente.idCliente,
      idAlmacen: this.idAlmacen.value,
      items: this.carrito.map((i) => ({ idProducto: i.idProducto, cantidad: i.cantidad }))
    };
  }

  /** /simular con un pequeño retraso; switchMap descarta los cálculos viejos. */
  private escucharRecalculo(): void {
    this.recalcular$
      .pipe(
        debounceTime(350),
        switchMap(() => {
          const datos = this.armarRequest();
          if (!datos || !this.cantidadesValidas) {
            this.simulacion = null;
            return of(undefined);
          }
          this.simulando = true;
          return this.cotizacionService.simular(datos).pipe(
            catchError((error: HttpErrorResponse) => {
              this.errorSimulacion = error.error?.mensaje ?? 'No se pudo calcular el total.';
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((resultado) => {
        this.simulando = false;
        if (resultado === undefined) return;
        this.simulacion = resultado;
        if (resultado) this.errorSimulacion = '';
      });
  }

  private escucharBuscadores(): void {
    this.buscarCliente.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.buscandoClientes = true)),
        switchMap((texto) =>
          texto.trim().length < 2 ? of([]) : this.clienteService.listar(null, texto.trim()).pipe(catchError(() => of([])))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((clientes) => {
        this.buscandoClientes = false;
        this.clientesEncontrados = clientes.filter((c) => c.activo).slice(0, 8);
      });

    this.buscarProducto.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.buscandoProductos = true)),
        switchMap((texto) =>
          texto.trim().length < 2
            ? of([])
            : this.productoService.listar({ texto: texto.trim() }).pipe(catchError(() => of([])))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((productos) => {
        this.buscandoProductos = false;
        this.productosEncontrados = productos.filter((p) => p.activo).slice(0, 8);
      });
  }

  /** Edición: solo se cambian los items; cliente y almacén quedan fijos. */
  private cargarBorrador(id: number): void {
    this.cargando = true;
    this.cotizacionService
      .obtener(id)
      .pipe(
        switchMap((cot) => {
          if (cot.estado !== 'BORRADOR') {
            this.toast.aviso('Solo se pueden editar cotizaciones en BORRADOR.');
            this.router.navigate(['/cotizaciones', id]);
            return of(null);
          }
          this.editando = cot;
          this.idAlmacen.setValue(cot.idAlmacen, { emitEvent: false });
          this.idAlmacen.disable({ emitEvent: false });
          this.carrito = cot.items.map((i) => ({
            idProducto: i.idProducto,
            sku: i.sku,
            nombre: i.nombreProducto,
            unidadMedida: '',
            cantidad: i.cantidad
          }));
          this.simulacion = cot;
          return this.clienteService.obtener(cot.clienteId);
        })
      )
      .subscribe({
        next: (cliente) => {
          this.cargando = false;
          if (cliente) {
            this.cliente = cliente;
            this.recalcular();
          }
        },
        error: () => (this.cargando = false)
      });
  }
}
