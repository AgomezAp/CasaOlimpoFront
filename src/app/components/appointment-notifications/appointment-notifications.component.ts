import { Component, OnInit } from '@angular/core';
import { AppointmentReminderService } from '../../services/appointment-reminder.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointment-notifications',
  imports: [CommonModule],
  templateUrl: './appointment-notifications.component.html',
  styleUrl: './appointment-notifications.component.css'
})
export class AppointmentNotificationsComponent implements OnInit {
  visible = false;
  citasHoy = 0;
  citasProximas = 0;
  
  constructor(private reminderService: AppointmentReminderService) {}
  
  ngOnInit(): void {
    // Suscribirse a los cambios en la notificación
    this.reminderService.showNotification$.subscribe(show => {
      this.visible = show;
    });
    
    this.reminderService.citasHoy$.subscribe(count => {
      this.citasHoy = count;
    });
    
    this.reminderService.citasProximas$.subscribe(count => {
      this.citasProximas = count;
    });
  }
  
  close(): void {
    this.reminderService.hideNotification();
  }
}