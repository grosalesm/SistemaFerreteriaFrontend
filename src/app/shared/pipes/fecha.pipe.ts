import { Pipe, PipeTransform } from '@angular/core';

/** "2026-10-13T10:15:30" -> "13/10/2026 10:15". Con soloFecha: "13/10/2026". */
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | null | undefined, soloFecha = false): string {
    return valor ? formatearFecha(valor, soloFecha) : '';
  }
}

export function formatearFecha(valor: string, soloFecha = false): string {
  // Un LocalDate ("2026-10-13") se interpreta en hora local, no en UTC.
  const fecha = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor);
  const dos = (n: number) => String(n).padStart(2, '0');
  const dia = `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
  return soloFecha ? dia : `${dia} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}