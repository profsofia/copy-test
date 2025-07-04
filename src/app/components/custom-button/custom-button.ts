// src/app/components/custom-button/custom-button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para ngClass o ngIf

@Component({
  selector: 'app-custom-button',
  standalone: true,
  imports: [CommonModule], // Importa CommonModule para directivas como ngClass
  templateUrl: './custom-button.html',
  styleUrls: ['./custom-button.scss']
})
export class CustomButtonComponent {
  // Propiedad de entrada para el texto del botón
  @Input() buttonText: string = 'Botón';

  // Propiedad de entrada opcional para el estado "activo/seleccionado"
  @Input() isActive: boolean = false;

  // Propiedad de entrada opcional para el tipo de botón (submit, button, reset)
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  // Propiedad de salida para emitir el evento cuando se hace clic
  @Output() clickEvent = new EventEmitter<void>();

  constructor() { }

  // Método que se ejecuta cuando se hace clic en el botón
  onClick(): void {
    this.clickEvent.emit(); // Emite el evento de clic
  }
}
