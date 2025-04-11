import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class DescuentoService {
  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = 'api/descuento'
    this.appUrl = environment.apiUrl
   }
  getDescuentos() {
    return this.http.get(`${this.appUrl}${this.apiUrl}/obtenerDescuento`);
  }

  createDescuento(descuento: any) {
    return this.http.post(`${this.appUrl}${this.apiUrl}/crearDescuento`, descuento);
  }

  updateDescuento(id: number, descuento: any) {
    return this.http.put(`${this.appUrl}${this.apiUrl}/actualizarDescuento/${id}`, descuento);
  }

  deleteDescuento(id: number) {
    return this.http.delete(`${this.appUrl}${this.apiUrl}/eliminarDescuento/${id}`);
  }
}
