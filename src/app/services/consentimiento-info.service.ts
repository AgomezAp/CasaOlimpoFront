import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../environments/environments';
export interface ConsentimientoInfo {
  Cid: number;
  numero_documento: string;
  fecha_creacion: string;
}

export interface ConsentimientoResponse {
  message: string;
  data: ConsentimientoInfo | ConsentimientoInfo[];
}
@Injectable({
  providedIn: 'root',
})
export class ConsentimientoInfoService {
    private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.appUrl = environment.apiUrl;
    this.apiUrl = 'api/consentimiento';
  }

  /**
   * Guarda un nuevo documento de consentimiento para un paciente
   */
guardarConsentimiento(numero_documento: string, documentoPdf: File): Observable<any> {
  const formData = new FormData();
  formData.append('consentimiento_info', documentoPdf);
  
  return this.http.post<any>(
    `${this.appUrl}${this.apiUrl}/${numero_documento}/crear`, 
    formData
  );
}

  /**
   * Obtiene todos los consentimientos de un paciente
   */
  obtenerConsentimientosPaciente(numero_documento: string): Observable<any> {
    // Corrección: Combina las URLs correctamente
    return this.http.get<any>(
      `${this.appUrl}${this.apiUrl}/${numero_documento}`
    );
  }

  /**
   * Descarga un documento de consentimiento por su ID
   */
  descargarConsentimiento(Cid: number): Observable<Blob> {
    // Corrección: Combina las URLs correctamente
    return this.http.get(`${this.appUrl}${this.apiUrl}/descargar/${Cid}`, {
      responseType: 'blob',
    });
  }

  /**
   * Elimina un consentimiento por su ID
   */
  eliminarConsentimiento(Cid: number): Observable<any> {
    // Corrección: Combina las URLs correctamente
    return this.http.delete<any>(`${this.appUrl}${this.apiUrl}/${Cid}`);
  }
}
