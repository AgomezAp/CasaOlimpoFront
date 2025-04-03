import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-paciente-nav',
  imports: [],
  templateUrl: './paciente-nav.component.html',
  styleUrl: './paciente-nav.component.css'
})
export class PacienteNavComponent {
  @Input() activeTab: string = 'info';
  @Output() tabChange = new EventEmitter<string>();

  tabs = [
    { id: 'info', label: 'Info' },
    { id: 'hclinica', label: 'H. Clínica' },
    { id: 'recetas', label: 'Recetas' },
    { id: 'citas', label: 'Citas' }
  ];

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }
}
