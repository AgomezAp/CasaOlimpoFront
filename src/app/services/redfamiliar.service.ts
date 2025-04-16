import { Injectable } from '@angular/core';
import { RedFamiliar } from '../interfaces/redfamiliar';
import { environment } from '../environments/environments';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
export interface RedFamiliarResponse {
  message: string;
  data: {
    paciente: {
      numero_documento: string;
      nombre: string;
      apellidos: string;
    };
    miembros_red_familiar: RedFamiliar[];
  };
}

export interface MiembroResponse {
  message: string;
  data: RedFamiliar;
}
@Injectable({
  providedIn: 'root'
})
export class RedfamiliarService {
  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) { 
     this.appUrl = environment.apiUrl;
    this.apiUrl = 'api/paciente';
  }

  crearMiembroRedFamiliar(numero_documento: string, miembro: Omit<RedFamiliar, 'Nid' | 'numero_documento_familiar'>): Observable<MiembroResponse> {
    return this.http.post<MiembroResponse>(
      `${this.appUrl}${this.apiUrl}/${numero_documento}/red-familiar`,
      miembro
    );
  }
  obtenerRedFamiliar(numero_documento: string): Observable<RedFamiliarResponse> {
    return this.http.get<RedFamiliarResponse>(
      `${this.appUrl}${this.apiUrl}/${numero_documento}/red-familiar`
    );
  }
  verificarSiTieneMiembros(numero_documento: string): Observable<boolean> {
    return this.obtenerRedFamiliar(numero_documento).pipe(
      map(response => {
        // Verificar si hay miembros en la red familiar
        return response.data.miembros_red_familiar && 
               response.data.miembros_red_familiar.length > 0;
      }),
      catchError(error => {
        console.error('Error al verificar miembros de red familiar:', error);
        return of(false); // En caso de error, asumimos que no tiene miembros
      })
    );
  }
  /**
   * Actualiza la información de un miembro de la red familiar
   */
  actualizarMiembroRedFamiliar(id: number, datosActualizados: Partial<RedFamiliar>): Observable<MiembroResponse> {
    return this.http.put<MiembroResponse>(
      `${this.appUrl}${this.apiUrl}/miembro/${id}`,
      datosActualizados
    );
  }

  /**
   * Elimina un miembro de la red familiar
   */
  eliminarMiembroRedFamiliar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.appUrl}${this.apiUrl}/miembro/${id}`
    );
  }

  /**
   * Establece un miembro como responsable legal del paciente
   */
  establecerResponsable(id: number): Observable<MiembroResponse> {
    return this.http.put<MiembroResponse>(
      `${this.appUrl}${this.apiUrl}/responsable/${id}`,
      {}
    );
  }

}
