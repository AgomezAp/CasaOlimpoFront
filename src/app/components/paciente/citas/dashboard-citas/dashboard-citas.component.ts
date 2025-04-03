import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-citas',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-citas.component.html',
  styleUrl: './dashboard-citas.component.css'
})
export class DashboardCitasComponent {
  @Input() pacienteId: string = '';
}
