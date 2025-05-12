import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NotificacionService } from './notificacion.service';
@Injectable({
  providedIn: 'root',
})
export class ErrorsService {
  constructor(
    private toastr: ToastrService,
    private notificacionService: NotificacionService
  ) {}

  messageError(e: HttpErrorResponse) {
    // Si tenemos un mensaje específico en error.message, lo usamos
    if (e.error?.message) {
      this.notificacionService.error(e.error.message);
      return;
    }

    // Si tenemos un mensaje en error.msg, lo usamos
    if (e.error?.msg) {
      this.notificacionService.error(e.error.msg);
      return;
    }

    // Manejo específico según códigos de estado HTTP
    switch (e.status) {
      case 401:
        // Manejo de errores de autenticación
        if (e.error?.detail?.includes('credentials')) {
          this.notificacionService.error(
            'Credenciales incorrectas. Por favor, verifique su usuario y contraseña.'
          );
        } else {
          this.notificacionService.error(
            'La sesión ha expirado. Por favor, inicie sesión nuevamente.'
          );
        }
        break;

      case 403:
        this.notificacionService.error(
          'No tiene permiso para realizar esta acción.'
        );
        break;

      case 404:
        this.notificacionService.error(
          'El recurso solicitado no fue encontrado.'
        );
        break;

      case 422:
        this.notificacionService.error(
          'Datos inválidos. Por favor, verifique la información ingresada.'
        );
        break;

      case 0:
        this.notificacionService.error(
          'No hay conexión con el servidor. Verifique su conexión a internet.'
        );
        break;

      case 500:
      case 501:
      case 502:
      case 503:
        this.notificacionService.error(
          'Error en el servidor. Por favor, intente más tarde.'
        );
        break;

      default:
        // Si llegamos aquí y aún hay e.error, intentamos extraer algún mensaje útil
        if (typeof e.error === 'string') {
          this.notificacionService.error(e.error);
        } else if (e.statusText) {
          this.notificacionService.error(`Error: ${e.statusText}`);
        } else {
          this.notificacionService.error(
            'Ocurrió un error inesperado. Por favor, intente nuevamente.'
          );
        }
    }
  }
}
