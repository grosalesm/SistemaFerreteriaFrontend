import { Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';
import { Cliente } from '../core/models/cliente.model';
import { Cotizacion } from '../core/models/cotizacion.model';
import { Comprobante, NOMBRE_METODO_PAGO, Pedido } from '../core/models/pedido.model';
import { formatearFecha } from './pipes/fecha.pipe';
import { formatearMoneda } from './pipes/moneda.pipe';

const NARANJA: [number, number, number] = [245, 124, 0];
const OSCURO: [number, number, number] = [31, 35, 41];
const GRIS: [number, number, number] = [110, 117, 125];

/**
 * Genera los PDF con jspdf + jspdf-autotable.
 * Las librerías se cargan recién al descargar (import dinámico) para no pesar en la carga inicial.
 */
@Injectable({ providedIn: 'root' })
export class PdfService {
  async cotizacion(cot: Cotizacion, cliente: Cliente | null, almacen: string): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const ancho = doc.internal.pageSize.getWidth();

    this.encabezado(doc, 'COTIZACIÓN', cot.codigo);

    // Datos de la cotización (derecha) y del cliente (izquierda)
    let y = 46;
    doc.setFontSize(10);
    this.etiqueta(doc, 'Cliente', 14, y);
    doc.setFont('helvetica', 'bold').text(cot.clienteNombre, 14, y + 5);
    doc.setFont('helvetica', 'normal');
    if (cliente) {
      let yCliente = y + 10;
      doc.text(`${cliente.tipoDocumento}: ${cliente.numeroDocumento}`, 14, yCliente);
      if (cliente.direccion) {
        const lineas: string[] = doc.splitTextToSize(cliente.direccion, 100);
        doc.text(lineas, 14, (yCliente += 5));
        yCliente += (lineas.length - 1) * 4.5;
      }
      if (cliente.telefono) doc.text(`Tel.: ${cliente.telefono}`, 14, yCliente + 5);
    }

    const xDer = ancho - 70;
    this.etiqueta(doc, 'Fecha de emisión', xDer, y);
    doc.text(formatearFecha(cot.fechaCreacion), xDer, y + 5);
    this.etiqueta(doc, 'Válida hasta', xDer, y + 11);
    doc.text(cot.fechaVencimiento ? formatearFecha(cot.fechaVencimiento) : '7 días desde su envío', xDer, y + 16);
    this.etiqueta(doc, 'Tipo de precio / almacén', xDer, y + 22);
    doc.text(`${cot.tipoCliente === 'CONTRATISTA' ? 'Contratista' : 'Minorista'} · ${almacen}`, xDer, y + 27);

    // Tabla de items
    y += 36;
    autoTable(doc, {
      startY: y,
      head: [['#', 'SKU', 'Descripción', 'Cant.', 'P. unit.', 'Dscto.', 'Subtotal']],
      body: cot.items.map((item, i) => [
        i + 1,
        item.sku,
        item.nombreProducto,
        item.cantidad,
        formatearMoneda(item.precioUnitario),
        item.porcentajeDescuento > 0 ? `${item.porcentajeDescuento} %` : '—',
        formatearMoneda(item.subtotal)
      ]),
      headStyles: { fillColor: OSCURO, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    // Totales (IGV incluido en los precios)
    y = this.finalTabla(doc) + 8;
    const totales: [string, string][] = [
      ['Subtotal', formatearMoneda(cot.subtotal)],
      ['Descuento por volumen', `- ${formatearMoneda(cot.descuentoTotal)}`],
      ['Op. gravada', formatearMoneda(cot.total - cot.igv)],
      ['IGV (18 %)', formatearMoneda(cot.igv)]
    ];
    y = this.bloqueTotales(doc, totales, cot.total, y);

    // Pie
    doc.setFontSize(8).setTextColor(...GRIS);
    doc.text(
      [
        'Precios en soles (S/) con IGV incluido.',
        'Los precios y la disponibilidad de stock se confirman al aprobar la cotización.',
        cot.fechaVencimiento
          ? `Cotización válida hasta el ${formatearFecha(cot.fechaVencimiento)}.`
          : 'La cotización tiene una vigencia de 7 días desde su envío.'
      ],
      14,
      y + 12
    );

    this.numerarPaginas(doc);
    doc.save(`${cot.codigo}.pdf`);
  }

  /** Boleta o factura de un pedido pagado. */
  async comprobante(pedido: Pedido, comp: Comprobante): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const ancho = doc.internal.pageSize.getWidth();
    const esFactura = comp.tipo === 'FACTURA';

    this.encabezado(doc, esFactura ? 'FACTURA' : 'BOLETA DE VENTA', comp.numeroComprobante);

    // Adquiriente (izquierda) y datos de la venta (derecha)
    const y = 46;
    this.etiqueta(doc, esFactura ? 'Razón social' : 'Cliente', 14, y);
    doc.setFont('helvetica', 'bold').text(comp.razonSocial, 14, y + 5, { maxWidth: 110 });
    doc.setFont('helvetica', 'normal');
    this.etiqueta(doc, esFactura ? 'RUC' : 'DNI', 14, y + 12);
    doc.text(comp.documentoCliente, 14, y + 17);
    if (pedido.tipoEntrega === 'DELIVERY' && pedido.direccionEntrega) {
      this.etiqueta(doc, 'Dirección de entrega', 14, y + 23);
      doc.text(pedido.direccionEntrega, 14, y + 28, { maxWidth: 110 });
    }

    const xDer = ancho - 70;
    this.etiqueta(doc, 'Fecha de emisión', xDer, y);
    doc.text(formatearFecha(comp.fechaEmision), xDer, y + 5);
    this.etiqueta(doc, 'Pedido / Cotización', xDer, y + 11);
    doc.text(`${pedido.codigo} / ${pedido.codigoCotizacion}`, xDer, y + 16);
    if (pedido.pago) {
      this.etiqueta(doc, 'Forma de pago', xDer, y + 22);
      const operacion = pedido.pago.numeroOperacion ? ` · Op. ${pedido.pago.numeroOperacion}` : '';
      doc.text(`Contado · ${NOMBRE_METODO_PAGO[pedido.pago.metodo]}${operacion}`, xDer, y + 27);
    }

    autoTable(doc, {
      startY: y + 38,
      head: [['#', 'SKU', 'Descripción', 'Cant.', 'P. unit.', 'Importe']],
      body: pedido.items.map((item, i) => [
        i + 1,
        item.sku,
        item.nombreProducto,
        item.cantidad,
        formatearMoneda(item.precioUnitario),
        formatearMoneda(item.subtotal)
      ]),
      headStyles: { fillColor: OSCURO, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    let yFinal = this.finalTabla(doc) + 8;
    yFinal = this.bloqueTotales(
      doc,
      [
        ['Op. gravada', formatearMoneda(comp.subtotal)],
        ['IGV (18 %)', formatearMoneda(comp.igv)]
      ],
      comp.total,
      yFinal
    );

    doc.setFontSize(8).setTextColor(...GRIS);
    doc.text(
      [
        `Representación impresa de la ${esFactura ? 'factura' : 'boleta de venta'} ${comp.numeroComprobante}.`,
        'Los precios unitarios incluyen IGV y descuentos por volumen. Importes en soles (S/).',
        '¡Gracias por su compra!'
      ],
      14,
      yFinal + 12
    );

    this.numerarPaginas(doc);
    doc.save(`${comp.numeroComprobante}.pdf`);
  }

  // ---------- Partes comunes ----------

  /** Logo, nombre de la ferretería y recuadro con el tipo y número de documento. */
  protected encabezado(doc: jsPDF, titulo: string, numero: string): void {
    const ancho = doc.internal.pageSize.getWidth();

    // "Logo": cuadrado naranja con las iniciales
    doc.setFillColor(...NARANJA).roundedRect(14, 12, 18, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(12).text('EC', 23, 23.5, { align: 'center' });

    doc.setTextColor(...OSCURO).setFontSize(16).text('Ferretería El Constructor', 36, 20);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRIS);
    doc.text('Materiales de construcción y ferretería en general', 36, 26);

    // Recuadro del documento
    doc.setDrawColor(...NARANJA).setLineWidth(0.6).roundedRect(ancho - 70, 11, 56, 20, 2, 2);
    doc.setTextColor(...NARANJA).setFont('helvetica', 'bold').setFontSize(11);
    doc.text(titulo, ancho - 42, 19, { align: 'center' });
    doc.setTextColor(...OSCURO).setFontSize(10).text(numero, ancho - 42, 26, { align: 'center' });

    doc.setDrawColor(230, 230, 230).setLineWidth(0.3).line(14, 37, ancho - 14, 37);
    doc.setFont('helvetica', 'normal').setTextColor(...OSCURO);
  }

  protected etiqueta(doc: jsPDF, texto: string, x: number, y: number): void {
    doc.setFontSize(8).setTextColor(...GRIS).text(texto.toUpperCase(), x, y);
    doc.setFontSize(10).setTextColor(...OSCURO);
  }

  /** Filas de totales alineadas a la derecha + total resaltado. Devuelve la Y final. */
  protected bloqueTotales(doc: jsPDF, filas: [string, string][], total: number, y: number): number {
    const ancho = doc.internal.pageSize.getWidth();
    const xEtiqueta = ancho - 80;
    const xValor = ancho - 14;

    doc.setFontSize(10).setTextColor(...OSCURO);
    for (const [etiqueta, valor] of filas) {
      doc.text(etiqueta, xEtiqueta, y);
      doc.text(valor, xValor, y, { align: 'right' });
      y += 6;
    }

    doc.setFillColor(...NARANJA).rect(xEtiqueta - 4, y - 4, 70, 9, 'F');
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(11);
    doc.text('TOTAL', xEtiqueta, y + 2);
    doc.text(formatearMoneda(total), xValor, y + 2, { align: 'right' });
    doc.setFont('helvetica', 'normal').setTextColor(...OSCURO);
    return y + 9;
  }

  protected finalTabla(doc: jsPDF): number {
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  protected numerarPaginas(doc: jsPDF): void {
    const paginas = doc.getNumberOfPages();
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= paginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8).setTextColor(...GRIS);
      doc.text(`Página ${i} de ${paginas}`, ancho - 14, alto - 8, { align: 'right' });
    }
  }
}
