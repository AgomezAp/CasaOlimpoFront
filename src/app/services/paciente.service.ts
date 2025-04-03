import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../interfaces/paciente';

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
  crearPaciente(paciente: Paciente): Observable<any> {
    return this.http.post(`${this.appUrl}${this.apiUrl}/crear`, paciente);
  }
  obtenerPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.appUrl}${this.apiUrl}/traer_todos`);
  }
  obtenerPacienteId(numero_documento: string): Observable<any> {
    return this.http.get<any>(`${this.appUrl}${this.apiUrl}/consultar/${numero_documento}`);
  }
  actualizarDatosPaciente(numero_documento: string, paciente: Paciente): Observable<Paciente[]> {
    return this.http.patch<Paciente[]>(`${this.appUrl}${this.apiUrl}/actualizar/${numero_documento}`, paciente);
  }
  actualizarFotoPaciente(numero_documento: string, foto: File): Observable<any> {
    const formData = new FormData();
    formData.append('foto', foto);

    return this.http.post(`${this.appUrl}${this.apiUrl}/${numero_documento}/foto`, formData);
  }
  eliminarFotoPaciente(numero_documento: string): Observable<any> {
    return this.http.delete(`${this.appUrl}${this.apiUrl}/${numero_documento}/foto`);
  }
  obtenerFotoPaciente(numero_documento: string): Observable<Blob> {
    return this.http.get(`${this.appUrl}${this.apiUrl}/${numero_documento}/foto`, {
      responseType: 'blob'
    });
  }
  
}
