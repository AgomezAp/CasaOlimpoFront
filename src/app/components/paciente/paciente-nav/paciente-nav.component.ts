import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-paciente-nav',
  standalone: true, 
  imports: [CommonModule],
  template: `
    <div class="nav-tabs">
      <button 
        *ngFor="let tab of tabs" 
        class="tab-btn" 
        [class.active]="activeTab === tab.id"
        (click)="setActiveTab(tab.id)">
        {{ tab.label }}
      </button>
    </div>
  `,
  styles: [`
    .nav-tabs {
      display: flex;
      align-items: stretch; /* Cambiado a stretch para que los botones ocupen toda la altura */
      background-color: #ffffff;
      width: 100%; /* Cambiado a 100% para adaptarse al contenedor padre */
      height: 75px;
      border-radius: 50px; /* Aumentado a 50px como solicitado */
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      justify-content: space-around;
      margin-bottom: 15px;
      overflow: hidden; /* Para que los botones no salgan del contenedor redondeado */
    }
    
    .tab-btn {
      border: none;
      background-color: transparent;
      color: #000000;
      font-size: 16px;
      font-weight: 500;
      padding: 0 25px; /* Eliminado padding vertical para usar altura completa */
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      flex: 1;
      height: 100%; /* Usar 100% de la altura del contenedor */
      margin: 0;
      max-width: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0; /* Quitamos border radius individual */
    }
    
    .tab-btn:hover:not(.active) {
      background-color: rgba(138, 136, 134, 0.1);
    }
    
    .tab-btn.active {
      background-color: rgba(138, 136, 134, 0.2);
      color: #000000;
      font-weight: 600;
      border-radius: 50px; /* Botón activo con bordes redondeados */
    }
  `]
})
export class PacienteNavComponent {
  @Input() activeTab: string = 'info';
  @Input() pacienteId: string = ''; 
  @Output() tabChange = new EventEmitter<string>();

  tabs = [
    { id: 'info', label: 'Info' },
    { id:'carpeta',label: 'Carpeta'},
    { id: 'hclinica', label: 'H. Clínica' },
    { id: 'recetas', label: 'Recetas' },
    { id: 'citas', label: 'Citas' }
  ];

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }
}
