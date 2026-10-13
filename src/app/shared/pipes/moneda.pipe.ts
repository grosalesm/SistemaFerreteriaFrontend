import { Pipe, PipeTransform } from '@angular/core';

const FORMATO = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234.5 -> "S/ 1,234.50" */
@Pipe({ name: 'moneda' })
export class MonedaPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '';
    }
    return `S/ ${FORMATO.format(valor)}`;
  }
}

/** Misma conversión para usar fuera de las plantillas (PDF, gráficos). */
export function formatearMoneda(valor: number): string {
  return `S/ ${FORMATO.format(valor)}`;
}