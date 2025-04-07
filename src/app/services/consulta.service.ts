import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { Consulta } from '../interfaces/consulta';
import { Observable } from 'rxjs';

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
  actualizarConsulta(numeroDocumento: string, consultaId: number, consulta: Partial<Consulta>): Observable<any> {
    const url = `${this.appUrl}${this.apiUrl}/${numeroDocumento}/consulta/${consultaId}`;
    return this.http.put(url, consulta, { headers: this.getSecureHeaders() });
  }
  cerrarConsulta(numeroDocumento: string, consultaId: number, datosCierre: any): Observable<any> {
    const url = `${this.appUrl}${this.apiUrl}/${numeroDocumento}/consulta/${consultaId}/cerrar`;
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
}
