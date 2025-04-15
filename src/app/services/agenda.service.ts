import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { environment } from '../environments/environments';
import { Agenda, AppointmentDisplay } from '../interfaces/agenda';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {

  private apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
      // Agregar token de autenticación si es necesario
      // 'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }
  /**
   * Obtiene todas las citas de personas registradas
   */
  getRegisteredAppointments(): Observable<AppointmentDisplay[]> {
    return this.http.get<any>(`${this.apiUrl}api/agenda/obtener_citas`, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          console.log('Respuesta original de citas registradas:', response);
          
          // Extraer el array de citas, dependiendo de la estructura de la respuesta
          const citas = response?.data || response?.citas || (Array.isArray(response) ? response : []);
          
          console.log('Citas extraídas:', citas);
          
          if (!Array.isArray(citas)) {
            console.error('No se pudo extraer un array de citas', response);
            return [];
          }
          
          // Transformar datos al formato que espera el calendario
          return citas.map(cita => this.transformRegisteredAppointment(cita));
        }),
        catchError(error => {
          console.error('Error obteniendo citas registradas:', error);
          return of([]);
        })
      );
  }
  private transformRegisteredAppointment(cita: any): AppointmentDisplay {
    // Extraer el nombre del paciente, que puede venir en diferentes formatos
    let patientName = 'Sin nombre';
    if (cita.paciente) {
      patientName = `${cita.paciente.nombre || ''} ${cita.paciente.apellido || ''}`.trim();
    }

    // Formatear la fecha si viene como objeto Date
    let dateStr = '';
    if (cita.fecha_cita) {
      if (typeof cita.fecha_cita === 'string') {
        dateStr = cita.fecha_cita;
      } else {
        // Si es un objeto Date, convertirlo a YYYY-MM-DD
        const date = new Date(cita.fecha_cita);
        dateStr = date.toISOString().split('T')[0];
      }
    }

    return {
      id: cita.Aid || cita.id,
      patientName: patientName,
      patientId: cita.numero_documento,
      date: dateStr,
      time: cita.hora_cita,
      type: 'consulta', // O mapear desde algún campo específico si existe
      notes: cita.descripcion,
      status: cita.estado,
      isRegistered: true,
      phone: cita.paciente?.telefono || cita.telefono,
      email: cita.paciente?.correo,
      duration: cita.duracion || 60
    };
  }

  /**
   * Obtiene citas por número de documento del doctor
   */
  getAppointmentsByDoctor(doctorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}api/agenda/obtener_citas/${doctorId}`, { headers: this.getHeaders() })
      .pipe(
        map(appointments => appointments.map(appointment => ({
          ...appointment,
          isRegistered: true
        }))),
        catchError(this.handleError<any[]>('getAppointmentsByDoctor', []))
      );
  }

  /**
   * Crear una cita para persona registrada
   */
  createRegisteredAppointment(appointmentData: Partial<Agenda>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}api/agenda/crear`, appointmentData, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error al crear cita:', error);
          return of({ error: true, message: error.error?.message || 'Error al crear la cita' });
        })
      );
  }

  /**
   * Actualizar cita de persona registrada
   */
  updateRegisteredAppointment(appointmentId: number, appointmentData: Partial<Agenda>): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}api/agenda/actualizar/${appointmentId}`, 
      appointmentData, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar cita:', error);
        return of({ error: true, message: error.error?.message || 'Error al actualizar la cita' });
      })
    );
  }

  /**
   * Eliminar cita de persona registrada
   */
  deleteRegisteredAppointment(appointmentId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}api/agenda/eliminar/${appointmentId}`, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar cita:', error);
        return of({ error: true, message: error.error?.message || 'Error al eliminar la cita' });
      })
    );
  }
  // ====== MÉTODOS PARA CITAS DE PERSONAS NO REGISTRADAS ======

  /**
   * Obtiene todas las citas de personas no registradas
   */
  getUnregisteredAppointments(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}api/agendaNoRegistrado/obtener_citas`, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          console.log('Respuesta citas no registradas:', response);
          
          // Extraer el array de citas según la estructura de la respuesta
          const citasNoRegistradas = Array.isArray(response) ? response : 
                                    (response.data || response.citas || []);
          
          // Transformar cada cita al formato común usado en el componente
          return citasNoRegistradas.map((cita:any) => ({
            id: cita.ANRid,
            patientName: `${cita.nombre} ${cita.apellidos}`,
            date: this.formatDateString(cita.fecha_cita),
            time: cita.hora_cita,
            type: 'consulta',
            // CAMBIAR ESTO:
            duration: cita.duracion || 60, // Usar la duración del backend o valor predeterminado
            status: this.mapBackendToFrontendStatus(cita.estado || 'Pendiente'),
            notes: '',
            isRegistered: false,
            phone: cita.telefono || ''
          }));
        }),
        catchError(error => {
          console.error('Error obteniendo citas no registradas:', error);
          return of([]);
        })
      );
  }
  private formatDateString(dateValue: any): string {
    if (!dateValue) return '';
    
    let dateObj;
    if (typeof dateValue === 'string') {
      dateObj = new Date(dateValue);
    } else {
      dateObj = new Date(dateValue);
    }
    
    if (isNaN(dateObj.getTime())) {
      console.error('Fecha inválida:', dateValue);
      return '';
    }
    
    return dateObj.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }
  private mapBackendToFrontendStatus(status: string): string {
    const mapping: {[key: string]: string} = {
      'Programada': 'Programada',
      'Confirmada': 'Confirmada',
      'Cancelada': 'Cancelada'
    };
    return mapping[status] || 'Programada';
  }
  /**
   * Crear una cita para persona no registrada
   */
  createUnregisteredAppointment(appointmentData: any): Observable<any> {
    // Copia profunda para no modificar los datos originales
    const processedData = {...appointmentData};
    
    // CORRECCIÓN: Normalizar el formato de fecha para evitar problemas de zona horaria
    if (processedData.fecha_cita) {
      // Si es un string, asegúrate de que sea YYYY-MM-DD sin componente de tiempo
      if (typeof processedData.fecha_cita === 'string') {
        // Eliminar componente de tiempo si existe
        processedData.fecha_cita = processedData.fecha_cita.split('T')[0];
      } else if (processedData.fecha_cita instanceof Date) {
        // Si es un objeto Date, asegurarnos de crear el string sin ajustes de zona horaria
        const d = processedData.fecha_cita;
        // Usar UTC para evitar cualquier ajuste de zona horaria
        processedData.fecha_cita = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      }
    }
    
    console.log('Datos normalizados para crear cita no registrada:', processedData);
    
    return this.http.post<any>(`${this.apiUrl}api/agendaNoRegistrado/crear`, processedData, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error al crear cita para paciente no registrado:', error);
          return of({ error: true, message: error.error?.message || 'Error al crear la cita' });
        })
      );
  }
  /**
   * Actualizar cita de persona no registrada
   */
  updateUnregisteredAppointment(appointmentId: string, appointmentData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}api/agendaNoRegistrado/actualizar/${appointmentId}`, appointmentData, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError<any>('updateUnregisteredAppointment'))
      );
  }

  /**
   * Eliminar cita de persona no registrada
   */
  deleteUnregisteredAppointment(appointmentId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}api/agendaNoRegistrado/eliminar/${appointmentId}`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError<any>('deleteUnregisteredAppointment'))
      );
  }

  // ====== MÉTODOS COMBINADOS PARA LA INTERFAZ ======

  /**
   * Obtiene todas las citas (registradas y no registradas)
   */
  getAllAppointments(): Observable<any[]> {
    return forkJoin([
      this.getRegisteredAppointments(),
      this.getUnregisteredAppointments()
    ]).pipe(
      map(([registeredAppointments, unregisteredAppointments]) => {
        // Marcar explícitamente cada tipo de cita
        const markedRegistered = registeredAppointments.map(cita => ({
          ...cita, 
          isRegistered: true
        }));
        
        const markedUnregistered = unregisteredAppointments.map(cita => ({
          ...cita, 
          isRegistered: false
        }));
        
        // Combinar ambos arrays
        return [...markedRegistered, ...markedUnregistered];
      }),
      catchError(error => {
        console.error('Error al obtener citas combinadas', error);
        return of([]); 
      })
    );
  }

  createAppointment(appointmentData: any): Observable<any> {
    if (appointmentData.isRegistered) {
      const registeredData: Partial<Agenda> = {
        correo: appointmentData.doctorEmail || localStorage.getItem('correo') || '', // Añadir correo del doctor
        numero_documento: appointmentData.patientId,
        fecha_cita: appointmentData.date,
        hora_cita: appointmentData.time,
        descripcion: appointmentData.notes || '',
        estado: this.mapEstadoToBackend(appointmentData.status) || 'Progamada',
        duracion: appointmentData.duration || 60
      };
      
      console.log('Enviando datos de cita registrada:', registeredData);
      return this.createRegisteredAppointment(registeredData);
    } else {
      const unregisteredData = {
        nombre: appointmentData.nombre, // Antes estaba usando unregisteredName
        apellidos: appointmentData.apellidos, // Antes estaba usando unregisteredLastName
        correo: appointmentData.doctorEmail || localStorage.getItem('correo') || '',
        fecha_cita: appointmentData.date,
        hora_cita: appointmentData.time,
        telefono: appointmentData.telefono || '', // Antes estaba usando unregisteredPhone
        estado: 'Programada',
        duracion: appointmentData.duration || 60,
        descripcion: appointmentData.notes || '',
      };
      
      console.log('Enviando datos de cita no registrada:', unregisteredData);
      return this.createUnregisteredAppointment(unregisteredData);
    }
  }
  private mapEstadoToBackend(status: string): 'Pendiente' | 'Confirmada' | 'Cancelada' {
    const mapping: {[key: string]: 'Pendiente' | 'Confirmada' | 'Cancelada'} = {
      'Programada': 'Pendiente',
      'Confirmada': 'Confirmada',
      'Cancelada': 'Cancelada'
    };
    return mapping[status] || 'Programada';
  }
  /**
   * Actualiza una cita dependiendo si es de paciente registrado o no
   */
  updateAppointment(appointmentId: string, appointmentData: any, isRegistered: boolean): Observable<any> {
    if (isRegistered) {
      return this.updateRegisteredAppointment(Number(appointmentId), appointmentData);
    } else {
      return this.updateUnregisteredAppointment(appointmentId, appointmentData);
    }
  }

  /**
   * Actualiza el estado de una cita
   */
  updateAppointmentStatus(appointmentId: string, status: string, isRegistered: boolean = true): Observable<any> {
    const data = { estado: status } as Partial<Agenda>;
    if (isRegistered) {
      return this.updateRegisteredAppointment(Number(appointmentId), data);
    } else {
      return this.updateUnregisteredAppointment(appointmentId, data);
    }
  }

  /**
   * Elimina una cita dependiendo si es de paciente registrado o no
   */
  deleteAppointment(appointmentId: string, isRegistered: boolean = true): Observable<any> {
    if (isRegistered) {
      return this.deleteRegisteredAppointment(Number(appointmentId));
    } else {
      return this.deleteUnregisteredAppointment(appointmentId);
    }
  }

  /**
   * Manejo de errores genérico
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} falló:`, error);
      // Puedes enviar el error a un servicio de registro remoto
      // Transformar el error para consumo de la UI
      return of(result as T);
    };
  }

  getCitasByPaciente(numeroDocumento: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}api/agenda/${numeroDocumento}/citas`, { headers });
  }
  getHorasOcupadas(fecha: string): Observable<string[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<any>(`${this.apiUrl}api/agenda/horas-ocupadas/${fecha}`, { headers })
      .pipe(
        map(response => response?.data || []),
        catchError(error => {
          console.error('Error al obtener horas ocupadas:', error);
          return of([]);
        })
      );
  }
}
