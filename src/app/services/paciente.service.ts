import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { Paciente } from '../interfaces/paciente';
interface ApiResponse<T> {
  data: T[];
  message?: string;
  status?: number;
}
@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) { 
    this.appUrl = environment.apiUrl;
    this.apiUrl = 'api/paciente';
  }
   // Método exclusivamente para crear paciente (sin foto)
   crearPaciente(paciente: any): Observable<any> {
    const doctorId = localStorage.getItem('userId');
    
    if (!doctorId) {
      console.error('No se encontró ID de doctor en localStorage');
      return throwError(() => new Error('No hay ID de doctor disponible'));
    }
    
    // Añadir el ID del doctor al objeto paciente
    const pacienteConDoctor = {
      ...paciente,
      Uid: doctorId // Añadimos el ID del doctor al objeto paciente
    };
    
    console.log('Enviando datos del paciente:', pacienteConDoctor);
    
    return this.http.post(`${this.appUrl}${this.apiUrl}/crear`, pacienteConDoctor)
      .pipe(
        catchError(error => {
          console.error('Error al crear paciente:', error);
          return throwError(() => error);
        })
      );
  }

  obtenerPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.appUrl}${this.apiUrl}/traer_todos`);
  }
  obtenerPacientesPorDoctor(): Observable<any> {
    const doctorId = localStorage.getItem('userId');
    
    if (!doctorId) {
      console.error('No se encontró ID de doctor en localStorage');
      return throwError(() => new Error('No hay ID de doctor disponible'));
    }
    
    return this.http.get<any>(`${this.appUrl}api/doctor/${doctorId}/pacientes`)
      .pipe(
        map(response => {
          // Si la respuesta tiene la estructura anidada, convertirla a un formato más simple
          if (response && response.data && response.data.pacientes) {
            // Guardar la información del doctor y total para uso futuro si es necesario
            const doctorInfo = {
              nombre: response.data.doctor,
              totalPacientes: response.data.total_pacientes
            };
            
            // Devolver un objeto más simple que tenga los pacientes directamente en data
            return {
              message: response.message,
              doctorInfo: doctorInfo,
              data: response.data.pacientes
            };
          }
          return response;
        }),
        catchError(error => {
          console.error('Error obteniendo pacientes por doctor:', error);
          return throwError(() => error);
        })
      );
  }
  obtenerPacienteId(numero_documento: string): Observable<any> {
    return this.http.get<any>(`${this.appUrl}${this.apiUrl}/consultar/${numero_documento}`);
  }
  actualizarDatosPaciente(numero_documento: string, paciente: Paciente): Observable<Paciente[]> {
    return this.http.patch<Paciente[]>(`${this.appUrl}${this.apiUrl}/actualizar/${numero_documento}`, paciente);
  }
  // Asegúrate de que este método esté correctamente implementado
actualizarFotoPaciente(numeroDocumento: string, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('foto', file);
  
  return this.http.post(`${this.appUrl}${this.apiUrl}/${numeroDocumento}/foto`, formData)
    .pipe(
      catchError(error => {
        console.error('Error al actualizar la foto del paciente:', error);
        return throwError(() => error);
      })
    );
}
  eliminarFotoPaciente(numero_documento: string): Observable<any> {
    return this.http.delete(`${this.appUrl}${this.apiUrl}/${numero_documento}/foto`);
  }
  obtenerFotoPaciente(numeroDocumento: string): Observable<Blob> {
    return this.http.get(`${this.appUrl}${this.apiUrl}/${numeroDocumento}/foto`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        // Extraer el blob del response
        return response.body || new Blob();
      }),
      catchError(error => {
        console.error('Error obteniendo la foto del paciente:', error);
        // Devolver un blob vacío en caso de error
        return of(new Blob());
      })
    );
  }
  transferirPaciente(numeroDocumento: string, doctorOrigenId: string, doctorDestinoId: string, comentario?: string): Observable<any> {
    if (!numeroDocumento || !doctorOrigenId || !doctorDestinoId) {
      console.error('Faltan datos obligatorios para la transferencia');
      return throwError(() => new Error('Datos de transferencia incompletos'));
    }
    
    const datos = {
      doctorOrigenId,
      doctorDestinoId,
      comentario
    };
    
    console.log(`Transfiriendo paciente ${numeroDocumento} del doctor ${doctorOrigenId} al doctor ${doctorDestinoId}`);
    
    return this.http.post<any>(`${this.appUrl}api/paciente/${numeroDocumento}/transferir`, datos)
      .pipe(
        catchError(error => {
          console.error(`Error al transferir paciente ${numeroDocumento}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Transfiere múltiples pacientes en una operación por lotes
   */
  transferirPacientesEnLote(datos: {
    doctorOrigenId: string;
    doctorDestinoId: string;
    pacientesIds: string[];
    comentario?: string;
  }): Observable<any> {
    if (!datos.pacientesIds || !Array.isArray(datos.pacientesIds) || datos.pacientesIds.length === 0) {
      return throwError(() => new Error('Lista de pacientes no válida o vacía'));
    }
    
    console.log(`Iniciando transferencia por lotes de ${datos.pacientesIds.length} pacientes`);
    
    // Crear un array de observables para cada paciente
    const transferencias = datos.pacientesIds.map(numeroDocumento => 
      this.transferirPaciente(
        numeroDocumento, 
        datos.doctorOrigenId, 
        datos.doctorDestinoId, 
        datos.comentario
      )
    );
    
    // Ejecutar todas las transferencias en paralelo
    return forkJoin(transferencias).pipe(
      map(resultados => {
        return {
          message: `Se transfirieron ${resultados.length} pacientes correctamente`,
          data: resultados
        };
      }),
      catchError(error => {
        console.error('Error en transferencia por lotes:', error);
        return throwError(() => error);
      })
    );
  }
  obtenerPacientesPorDoctorId(doctorId: string): Observable<any> {
    if (!doctorId) {
      console.error('No se proporcionó ID de doctor');
      return throwError(() => new Error('No hay ID de doctor disponible'));
    }
    
    return this.http.get<any>(`${this.appUrl}api/doctor/${doctorId}/pacientes`)
      .pipe(
        map(response => {
          // Si la respuesta tiene la estructura anidada, convertirla a un formato más simple
          if (response && response.data && response.data.pacientes) {
            return { data: response.data.pacientes };
          }
          return response;
        }),
        catchError(error => {
          console.error(`Error al obtener pacientes del doctor ${doctorId}:`, error);
          return throwError(() => error);
        })
      );
  }
}
