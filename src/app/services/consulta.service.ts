import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { Consulta } from '../interfaces/consulta';
import { catchError, map, Observable, of, shareReplay, throwError } from 'rxjs';
import { finalize, timeout } from 'rxjs/operators';
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
 

  crearConsulta(numeroDocumento: string, consulta: Consulta): Observable<any> {
    const url = `${this.appUrl}${this.apiUrl}/${numeroDocumento}/consulta`;
    return this.http.post(url, consulta,);
  }
  obtenerConsultasPorPaciente(numeroDocumento: string): Observable<any> {
    const url = `${this.appUrl}${this.apiUrl}/${numeroDocumento}/consultas`;
    return this.http.get(url);
  }
  actualizarConsulta(numeroDocumento: string, Cid: number, consulta: Partial<Consulta>): Observable<any> {
    // Construir la URL para que coincida exactamente con tu backend
    const url = `${this.appUrl}api/paciente/${numeroDocumento}/consulta/${Cid}`;
    
    console.log('Actualizando consulta:', url, consulta);
    
    return this.http.put(url, consulta)
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
    return this.http.patch(url, datosCierre);
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
  const url = `${this.appUrl}api/consulta/${Cid}/consentimiento/traer`;
  return this.http.get(url, {
    responseType: 'blob' as 'json',
  }).pipe(
    map(response => {
      if (response instanceof Blob) {
        return response;
      }
      throw new Error('Formato de respuesta inesperado');
    }),
    catchError(error => {
      if (error.status === 404) {
        return throwError(() => new Error('Documento no encontrado'));
      }
      return throwError(() => error);
    })
  );
}
guardarConsentimiento(consultaId: string, file: File | Blob): Observable<any> {
  const formData = new FormData();
  formData.append('consentimiento_info', file, 'consentimiento_info.pdf');
  
  return this.http.post<any>(
    `${this.appUrl}api/consulta/${consultaId}/consentimiento`,
    formData
  ).pipe(
    catchError(error => {
      console.error('Error al guardar el consentimiento:', error);
      return throwError(() => error);
    })
  );
}
obtenerConsultaPorId(Cid: number): Observable<Consulta> {
  const url = `${this.appUrl}api/consulta/${Cid}`;
  
  console.log('Obteniendo datos de consulta:', url);
  
  return this.http.get<any>(url)
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
obtenerConsultaPaciente(numeroDocumento: string, consultaId: number): Observable<any> {
  const url = `${this.appUrl}api/paciente/${numeroDocumento}/consulta/${consultaId}`;
  
  return this.http.get<any>(url).pipe(
    map(response => {
      if (response && response.data) {
        console.log('Consulta obtenida correctamente:', consultaId);
        return response.data;
      }
      throw new Error('No se encontró la consulta o el formato de respuesta es inválido');
    }),
    catchError(error => {
      let errorMessage = 'Error al obtener la consulta';
      
      if (error.status === 404) {
        errorMessage = 'La consulta solicitada no existe';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permiso para acceder a esta consulta';
      } else if (error.status === 400) {
        errorMessage = 'ID de consulta inválido';
      }
      
      console.error(`${errorMessage}:`, error);
      return throwError(() => new Error(errorMessage));
    })
  );
}
verificarExistenciaConsentimiento(consultaId: number): Observable<boolean> {
  // Primero intentamos con el endpoint ideal (si existe)
  const url = `${this.appUrl}api/consulta/${consultaId}/verificar-consentimiento`;
  
  // Si el endpoint no existe, usaremos un enfoque alternativo
  return this.http.get<any>(url).pipe(
    map(response => {
      if (response && response.data) {
        return !!response.data.tieneConsentimiento;
      }
      return false;
    }),
    catchError(error => {
      console.log('Usando enfoque alternativo para verificar consentimiento de consulta', consultaId);
      
      // Si el endpoint no existe (404), usamos el método alternativo
      return this.verificarConsentimientoAlternativo(consultaId);
    })
  );
}

/**
 * Método alternativo para verificar si una consulta tiene consentimiento
 * utilizando la información del objeto de consulta
 */
private verificarConsentimientoAlternativo(consultaId: number): Observable<boolean> {
  // Usar el método existente para obtener la consulta completa
  return this.obtenerConsultaPorId(consultaId).pipe(
    map(consulta => {
      // Verificar si alguno de estos campos indica la existencia de un consentimiento
      const tieneConsentimiento = !!(
        consulta.consentimiento_check || 
        consulta.consentimiento_info
      );
      
      console.log(`Consulta ${consultaId} verificada por método alternativo: ${tieneConsentimiento ? 'Tiene' : 'No tiene'} consentimiento`);
      return tieneConsentimiento;
    }),
    catchError(error => {
      console.error(`Error al verificar consentimiento de forma alternativa para consulta ${consultaId}:`, error);
      return of(false);
    })
  );
}
}
