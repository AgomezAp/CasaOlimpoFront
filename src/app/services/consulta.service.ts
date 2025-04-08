import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { Consulta } from '../interfaces/consulta';
import { catchError, map, Observable, of, shareReplay, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  private appUrl: string;
  private apiUrl: string;
  constructor(private http: HttpClient) { 
    this.appUrl = environment.apiUrl;
    this.apiUrl = 'api/paciente';
  }
  private getSecureHeaders(): HttpHeaders {
    // Aquí deberías agregar el token de autenticación si lo estás usando
    return new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${this.authService.getToken()}` // Descomentar si usas JWT
    });
  }

  crearConsulta(numeroDocumento: string, consulta: Consulta): Observable<any> {
    const url = `${this.appUrl}${this.apiUrl}/${numeroDocumento}/consulta`;
    return this.http.post(url, consulta, { headers: this.getSecureHeaders() });
  }
  obtenerConsultasPorPaciente(numeroDocumento: string): Observable<any> {
    const url = `${this.appUrl}${this.apiUrl}/${numeroDocumento}/consultas`;
    return this.http.get(url, { headers: this.getSecureHeaders() });
  }
  actualizarConsulta(numeroDocumento: string, Cid: number, consulta: Partial<Consulta>): Observable<any> {
    // Construir la URL para que coincida exactamente con tu backend
    const url = `${this.appUrl}api/paciente/${numeroDocumento}/consulta/${Cid}`;
    
    console.log('Actualizando consulta:', url, consulta);
    
    return this.http.put(url, consulta, { headers: this.getSecureHeaders() })
      .pipe(
        map(response => response),
        catchError(error => {
          console.error('Error al actualizar consulta:', error);
          return throwError(() => error);
        })
      );
  }
  cerrarConsulta(numeroDocumento: string, Cid: number, datosCierre: any): Observable<any> {
    const url = `${this.appUrl}${this.apiUrl}/${numeroDocumento}/consulta/${Cid}/cerrar`;
    return this.http.patch(url, datosCierre, { headers: this.getSecureHeaders() });
  }
  estaConsultaAbierta(consulta: Consulta): boolean {
    return consulta.abierto === true;
  }
  formatearFecha(fecha: Date): string {
    if (!fecha) return 'No disponible';
    
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  sanitizarEntrada(input: string): string {
    if (!input) return '';
    // Eliminar posibles scripts y caracteres peligrosos
    return input
      .replace(/<script.*?>.*?<\/script>/gi, '')
      .replace(/[<>"']/g, (match) => {
        return {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[match] || match;
      });
  }
  // En consulta.service.ts
crearConsultaConArchivo(numeroDocumento: string, formData: FormData) {
  return this.http.post<any>(
    `${this.appUrl}${this.apiUrl}/${numeroDocumento}/consulta`, 
    formData
  );
}
obtenerInformacionBasicaPaciente(numeroDocumento: string): Observable<any> {
  const url = `${this.apiUrl}/pacientes/${numeroDocumento}/info-basica`;
  
  // Si tu API no tiene este endpoint, puedes simularlo usando finalize y first
  // para tomar solo la primera respuesta rápida
  return this.http.get<any>(url).pipe(
    catchError(() => {
      // Si no existe el endpoint, devolver un objeto vacío
      return of({
        fechaCreacion: null,
        tieneConsultaAbierta: false
      });
    })
  );
}

// Método optimizado para consultas
obtenerConsultasOptimizadas(numeroDocumento: string): Observable<Consulta[]> {
  // Usar el mismo endpoint pero con mejoras en el procesamiento
  return this.obtenerConsultasPorPaciente(numeroDocumento).pipe(
    map(response => {
      // Ya ordenadas por fecha (más reciente primero)
      const consultas = response.data || [];
      return consultas.sort((a:any, b:any) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    }),
    // Importante: compartir la respuesta para evitar múltiples solicitudes
    shareReplay(1)
  );
}
obtenerConsentimientoPDF(Cid: number): Observable<Blob> {
  // Corregir la URL para que coincida con la estructura de tus otros endpoints
  const url = `${this.appUrl}api/consulta/${Cid}/consentimiento`;
  
  console.log('Solicitando documento desde:', url);
  
  // Solicitar el documento como blob sin verificar el tipo
  return this.http.get(url, {
    responseType: 'blob'
  }).pipe(
    map(response => {
      // Aceptar cualquier tipo de documento binario
      console.log('Documento recibido, tipo:', response.type);
      
      // Si la respuesta ya es un Blob, devolverla directamente
      if (response instanceof Blob) {
        return response;
      }
      
      // Si llegamos aquí, algo inesperado ocurrió
      throw new Error('Formato de respuesta inesperado');
    }),
    catchError(error => {
      if (error.status === 404) {
        console.error('Documento no encontrado:', error);
        return throwError(() => new Error('Documento no encontrado'));
      }
      
      console.error('Error al obtener el documento:', error);
      return throwError(() => error);
    })
  );
}
obtenerConsultaPorId(Cid: number): Observable<Consulta> {
  const url = `${this.appUrl}api/consulta/${Cid}`;
  
  console.log('Obteniendo datos de consulta:', url);
  
  return this.http.get<any>(url, { headers: this.getSecureHeaders() })
    .pipe(
      map(response => {
        if (response && response.data) {
          console.log('Consulta obtenida:', response.data);
          return response.data;
        }
        throw new Error('No se encontró la consulta o formato inválido');
      }),
      catchError(error => {
        console.error('Error al obtener consulta:', error);
        return throwError(() => error);
      })
    );
}
}
