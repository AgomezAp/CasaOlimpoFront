import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private appUrl: string;
  private apiUrl: string

  constructor(private http: HttpClient) {
    this.apiUrl = 'api/facturacion'
    this.appUrl = environment.apiUrl
   }
}
