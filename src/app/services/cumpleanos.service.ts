import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../environments/environments";
import { User } from "../interfaces/user";
import { Observable } from "rxjs";
@Injectable({
    providedIn: 'root'
  })
  export class CumpleanosService {
    private appUrl: string;
    private apiUrl: string;

    constructor(private http: HttpClient) {
        this.appUrl = environment.apiUrl
        this.apiUrl = 'api/mensajeria'
    }

    obtenerCumple(user: User): Observable<any> {
        const headers = { Autorization: `Bearer ${localStorage.getItem('token')}`};
        return this.http.get(`${this.appUrl}${this.apiUrl}/obtenerCumple`)
    }

    obtenerMensaje(data: any): Observable<any> {
      return this.http.post(`${this.appUrl}${this.apiUrl}/obtenerMensaje`, data);
    }

    mensaje(data: any): Observable<any> {
      return this.http.get(`${this.appUrl}${this.apiUrl}/mensaje`)
    }
  }