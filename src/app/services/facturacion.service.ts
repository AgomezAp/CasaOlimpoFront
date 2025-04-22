import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private appUrl: string;
  private apiUrl: string
  paciente: any;

  constructor(private http: HttpClient) {
    this.apiUrl = 'api/facturacion'
    this.appUrl = environment.apiUrl
   }

   crearFactura(){
    return this.http.post(`${this.appUrl}${this.apiUrl}/crearFactura`, {})
   }

   imprimir(){
    return this.http.get(`${this.appUrl}${this.apiUrl}/reimprimir`)
   }

   verFactura() {
    return this.http.get(`${this.appUrl}${this.apiUrl}/verFactura`)
   }

   facturaId() {
    return this.http.get(`${this.appUrl}${this.apiUrl}/facturas`, {})
   }
}
