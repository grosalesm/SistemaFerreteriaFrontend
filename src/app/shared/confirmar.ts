import Swal from 'sweetalert2';

/** Confirmación con SweetAlert2 (aprobar, anular, desactivar...). Devuelve true si el usuario acepta. */
export async function confirmar(
  titulo: string,
  texto: string,
  boton = 'Sí, continuar',
  peligro = false
): Promise<boolean> {
  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    icon: peligro ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: boton,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: peligro ? '#dc3545' : '#f57c00',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    focusCancel: peligro
  });
  return resultado.isConfirmed;
}