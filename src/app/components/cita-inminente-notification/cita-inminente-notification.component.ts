import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppointmentReminderService } from '../../services/appointment-reminder.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cita-inminente-notification',
  imports: [CommonModule, RouterModule],
  templateUrl: './cita-inminente-notification.component.html',
  styleUrl: './cita-inminente-notification.component.css'
})
export class CitaInminenteNotificationComponent implements OnInit, OnDestroy {
  mostrar: boolean = false;
  citasHoy: number = 0;
  citasProximas: number = 0;
  citasLista: any[] = [];
  
  private subscripciones: Subscription[] = [];
  
  constructor(private reminderService: AppointmentReminderService) { }
  
  ngOnInit(): void {
    // Suscribirse a los observables del servicio
    this.subscripciones.push(
      this.reminderService.showNotification$.subscribe(show => {
        this.mostrar = show;
      }),
      
      this.reminderService.citasHoy$.subscribe(count => {
        this.citasHoy = count;
      }),
      
      this.reminderService.citasProximas$.subscribe(count => {
        this.citasProximas = count;
      }),
      
      this.reminderService.citasProximasList$.subscribe(lista => {
        this.citasLista = lista;
      })
    );
  }
  
  ngOnDestroy(): void {
    // Liberar todas las suscripciones para evitar memory leaks
    this.subscripciones.forEach(sub => sub.unsubscribe());
  }
  
  cerrarPopup(): void {
    this.reminderService.ocultarNotificacion();
  }
  
  irAAgenda(): void {
    // Navegar a la vista de agenda (implementar según tu enrutamiento)
    this.cerrarPopup();
    // Ejemplo: this.router.navigate(['/agenda']);
  }
  
  formatFecha(cita: any): string {
    try {
      const fechaStr = cita.fecha_cita || cita.fecha || cita.date;
      if (!fechaStr) return 'Fecha no disponible';
      
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return 'Fecha inválida';
      
      // Verificar si es hoy
      const hoy = new Date();
      if (
        fecha.getDate() === hoy.getDate() &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      ) {
        return 'Hoy';
      }
      
      // Verificar si es mañana
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      if (
        fecha.getDate() === manana.getDate() &&
        fecha.getMonth() === manana.getMonth() &&
        fecha.getFullYear() === manana.getFullYear()
      ) {
        return 'Mañana';
      }
      
      // Formato para otros días
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } catch (e) {
      return 'Fecha no disponible';
    }
  }
  
  obtenerNombrePaciente(cita: any): string {
    if (cita.patientName) return cita.patientName;
    
    if (cita.nombre) {
      const apellido = cita.apellidos || cita.apellido || '';
      return `${cita.nombre} ${apellido}`.trim();
    }
    
    if (cita.nombre_paciente) {
      const apellido = cita.apellidos_paciente || '';
      return `${cita.nombre_paciente} ${apellido}`.trim();
    }
    
    return 'Paciente';
  }
}