import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})
export class HistoriaClinicaComponent {
  @Input() pacienteId: string = '';
}
