import { AbstractControl } from '@angular/forms';

/** true si el control tiene error y el usuario ya lo tocó (para pintar .is-invalid). */
export function esInvalido(control: AbstractControl | null): boolean {
  return !!control && control.invalid && (control.touched || control.dirty);
}