import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AppointmentReminderService } from '../../services/appointment-reminder.service';
import { AppointmentNotificationsComponent } from '../appointment-notifications/appointment-notifications.component';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterModule,CommonModule,AppointmentNotificationsComponent],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  citasHoy$: Observable<number>;
  esAdmin: boolean = false;
  constructor(private router: Router, private reminderService: AppointmentReminderService) { 
    this.citasHoy$ = this.reminderService.citasHoy$;
  }
  menuItems = [
    { path: '/agenda-dashboard', label: 'Agenda', icon: 'calendar' },
    { path: '/paciente-dashboard', label: 'Pacientes', icon: 'people' },
    { path: '/cumpleaños', label: 'Cumpleaños', icon: 'cake' },
    { path: '/descuentos', label: 'Descuentos', icon: 'discount' },
    { path: '/factura-dashboard', label: 'Facturación', icon: 'receipt' },
    { path: '/admin', label: 'Administración', icon: 'settings' },
    { path: '/logout', label: 'Salir', icon: 'logout' }
  ];
  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('nombreCompleto');
    
    // Redireccionar al login
    this.router.navigate(['/']);
  }
}
