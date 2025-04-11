import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // en milisegundos
}
@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private counter = 0;

  constructor() { }

  // Observable para que los componentes puedan suscribirse
  get notifications$(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  // Añadir una nueva notificación
  show(
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info', 
    duration: number = 5000
  ): number {
    const id = this.counter++;
    
    const notification: Notification = {
      id,
      type,
      message,
      duration
    };

    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto-eliminar después del tiempo especificado
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  // Mostrar notificación de éxito
  success(message: string, duration: number = 5000): number {
    return this.show(message, 'success', duration);
  }

  // Mostrar notificación de error
  error(message: string, duration: number = 5000): number {
    return this.show(message, 'error', duration);
  }

  // Mostrar notificación de advertencia
  warning(message: string, duration: number = 5000): number {
    return this.show(message, 'warning', duration);
  }

  // Mostrar notificación informativa
  info(message: string, duration: number = 5000): number {
    return this.show(message, 'info', duration);
  }

  // Eliminar una notificación específica por ID
  remove(id: number): void {
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  // Eliminar todas las notificaciones
  clear(): void {
    this.notificationsSubject.next([]);
  }
}
