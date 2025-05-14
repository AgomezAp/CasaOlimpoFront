import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  catchError,
  throwError,
} from 'rxjs';

import { ErrorsService } from '../services/errors.service';

let sessionErrorShown = false;

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorsService); 
  const router = inject(Router); 

  // No agregar token para la ruta de login
  if (req.url.includes('/login')) {
    return next(req);
  }

  const token = localStorage.getItem('token'); 
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token || ''}`,
    },
  });

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo mostrar el error y redirigir una vez cuando ocurre error 401
      if (error.status === 401 && !sessionErrorShown) {
        sessionErrorShown = true;
        
        // Mostrar mensaje de sesión expirada
        errorService.messageError(new HttpErrorResponse({
          error: { message: 'La sesión ha expirado. Por favor, inicie sesión nuevamente.' },
          status: 401,
          statusText: 'Unauthorized'
        }));
        
        // Limpiar el token
        localStorage.removeItem('token');
        
        // Redirigir al login
        router.navigate([''])
          .then(() => {
            // Resetear la bandera después de un tiempo para permitir futuros inicios de sesión
            setTimeout(() => {
              sessionErrorShown = false;
            }, 2000);
          });
      }
      
      return throwError(() => error);
    })
  );
};