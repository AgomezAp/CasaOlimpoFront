import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarpetaService {
  private appUrl: string;
  private apiUrl: string;
  constructor(private http: HttpClient) { 
    this.appUrl = environment.apiUrl;
    this.apiUrl = 'api/carpeta';
  }
  obtenerCarpeta(numeroDocumento: string): Observable<any> {
    return this.http.get(`${this.appUrl}${this.apiUrl}/consultar/${numeroDocumento}`);
  }
  
  /**
   * Crea una nueva carpeta para un paciente
   */
  crearCarpeta(carpetaData: any): Observable<any> {
    return this.http.post(`${this.appUrl}${this.apiUrl}/crear`, carpetaData);
  }
  
  /**
   * Sube una imagen a una carpeta
   */
  subirImagen(carpetaId: string, archivo: File, descripcion: string): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    formData.append('descripcion', descripcion || '');
    
    return this.http.post(`${this.appUrl}${this.apiUrl}/imagen/${carpetaId}`, formData);
  }
  
  /**
   * Elimina una imagen de una carpeta
   */
  eliminarImagen(carpetaId: string, imagenId: string): Observable<any> {
    return this.http.delete(`${this.appUrl}${this.apiUrl}/imagen/${carpetaId}/${imagenId}`);
  }
}
