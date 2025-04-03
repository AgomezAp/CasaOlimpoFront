import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Receta } from '../interfaces/receta';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environments';
interface ApiResponse<T> {
  message: string;
  data: T;
}
@Injectable({
  providedIn: 'root'
})
export class RecetaService {
  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) { 
    this.appUrl = environment.apiUrl;
    this.apiUrl = 'api/paciente';
  }

  // Obtener todas las recetas
  obtenerRecetas(): Observable<any> {
    return this.http.get<any>(`${this.appUrl}${this.apiUrl}/recetas/obtenerRecetas`);
  }
  
  // Obtener recetas por número de documento
  obtenerRecetasPorPaciente(numero_documento: string): Observable<any> {
    return this.http.get<any>(`${this.appUrl}${this.apiUrl}/${numero_documento}/recetas/obtener-paciente`);
  }

  // Crear una receta - CORREGIDO para usar numero_documento en la URL
  crearReceta(numero_documento: string, receta: any): Observable<any> {
    return this.http.post<any>(`${this.appUrl}${this.apiUrl}/${numero_documento}/recetas/crear`, receta);
  }

  // Editar una receta existente
  editarReceta(RecetaId: number, receta: any): Observable<any> {
    return this.http.put<any>(`${this.appUrl}${this.apiUrl}/recetas/${RecetaId}`, receta);
  }

  // Marcar una receta como completada
  completarReceta(RecetaId: number, motivo: string): Observable<any> {
    // Asegurarse de que la ruta coincida con la estructura del backend
    return this.http.patch<any>(`${this.appUrl}api/paciente/recetas/${RecetaId}/completar`, { motivo });
  }

}
