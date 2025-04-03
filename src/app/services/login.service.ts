import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private appUrl: string;
  private apiUrl: string;
  constructor(private http: HttpClient) {
    this.appUrl = environment.apiUrl;
    this.apiUrl = 'api/usuario';
  }
  registrarUsuario(user: User): Observable<any> {
    return this.http.post(`${this.appUrl}${this.apiUrl}/registrar`, user);
  }
  iniciarSesion(user: User): Observable<any> {
    return this.http.post(`${this.appUrl}${this.apiUrl}/iniciar-sesion`, user);
  }
  reestablecerContraseña(data:{correo:string, contraseña:string}): Observable<any> {
    return this.http.post(`${this.appUrl}${this.apiUrl}/reestablecer-contraseña`, data);
  }
  eliminarUsuarioId(id: number): Observable<any> {
    return this.http.delete(`${this.appUrl}${this.apiUrl}/eliminar/${id}`);
  }

}
