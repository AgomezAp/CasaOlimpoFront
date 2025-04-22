import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl: string;

  
  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
  }

  /**
   * Obtiene todos los usuarios del sistema
   */
  obtenerUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/usuario/obtener`);
  }

  /**
   * Registra un nuevo usuario en el sistema
   */
  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}api/usuario/registrar`, usuario);
  }

  /**
   * Restablece la contraseña de un usuario
   */
  reestablecerContraseña(datos: {correo: string, contrasena: string}): Observable<any> {
    return this.http.patch(`${this.apiUrl}api/usuario/reestablecer-contrasena`, datos);
  }

  /**
   * Elimina un usuario por su ID
   */
  eliminarUsuario(Uid: any): Observable<any> {
    console.log(`Eliminando usuario con ID: ${Uid}`);
    return this.http.delete(`${this.apiUrl}api/usuario/eliminar/${Uid}`);
  }

  /**
   * Actualiza los datos de un usuario
   * Nota: Este endpoint no aparece en tu backend, considera ajustarlo
   */
  actualizarUsuario(id: string, datos: any): Observable<any> {
    // Como no veo este endpoint en tu backend, uso una aproximación
    // Considera implementar este endpoint en tu backend o ajustar esta llamada
    return this.http.put(`${this.apiUrl}api/usuario/actualizar/${id}`, datos);
  }

  /**
   * Obtiene solo los usuarios con rol de doctor
   * Nota: Este endpoint no aparece en tu backend, considera implementarlo
   */
  obtenerDoctores(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/usuario/obtener`).pipe(
      map(response => {
        // Usar aserción de tipo para indicar a TypeScript la estructura
        const typedResponse = response as { data: any[] };
        
        if (typedResponse && typedResponse.data) {
          const doctores = typedResponse.data.filter(usuario => 
            usuario.rol === 'doctor' || usuario.rol === 'Doctor'
          );
          
          return {
            ...typedResponse,
            data: doctores
          };
        }
        return response;
      }),
      catchError(error => {
        console.error('Error al obtener doctores:', error);
        return throwError(() => error);
      })
    );
  }
}
