import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotificacionService, Notification } from '../../../services/notificacion.service';

@Component({
  selector: 'app-notificacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificacion.component.html',
  styleUrl: './notificacion.component.css',
  animations: [
    trigger('notificationAnimation', [
      state('void', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition('void => visible', animate('300ms ease-out')),
      transition('visible => void', animate('200ms ease-in'))
    ])
  ]
})
export class NotificacionComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificacionService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  // Obtener ícono según el tipo de notificación
  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  }

  // Cerrar una notificación específica
  close(id: number): void {
    this.notificationService.remove(id);
  }

  // Obtener la animación de estado para cada notificación
  getAnimationState(_notification: Notification): string {
    return 'visible';
  }
}