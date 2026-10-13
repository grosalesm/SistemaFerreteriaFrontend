import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Marcador temporal para los módulos de las siguientes fases. */
@Component({
  selector: 'app-en-construccion',
  template: `
    <h1 class="h4 mb-4">{{ titulo }}</h1>
    <div class="card border-0 shadow-sm">
      <div class="card-body text-center text-muted py-5">
        <i class="bi bi-cone-striped fs-1 d-block mb-2 text-acento"></i>
        Módulo en construcción.
      </div>
    </div>
  `
})
export class EnConstruccionComponent {
  titulo: string = inject(ActivatedRoute).snapshot.data['titulo'] ?? '';
}