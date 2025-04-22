import { Component } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router, RouterLink } from '@angular/router';
import { ErrorsService } from '../../services/errors.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  correo: string = '';
  contrasena: string = '';
  loading: boolean = false;

  constructor(
    private userService: LoginService,
    private router: Router,
    private errorService: ErrorsService,
    private notificacionService: NotificacionService
  ) {}
  logIn() {
    if (this.correo === '' || this.contrasena === '') {
      this.notificacionService.error(
        'Todos los campos son obligatorios',
      );
      return;
    }

    const user = { correo: this.correo, contrasena: this.contrasena };
    this.loading = true;
    this.errorMessage = '';

    this.userService.iniciarSesion(user).subscribe({
      next: (response: any) => {
        const token = response.token;
        const Uid = response.Uid;
        const nombre = response.nombre;
        this.loading = false;
        this.notificacionService.success('Bienvenido');
        localStorage.setItem('token', token);
        localStorage.setItem('userId', Uid);
        localStorage.setItem('correo', this.correo);
        localStorage.setItem('nombreCompleto', nombre);
        console.log(response.nombre);
        this.router.navigate(['/agenda-dashboard']);
      },
      error: (e: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = 'No se pudo iniciar sesión. Verifica tus datos'
        this.errorService.messageError(e);
      },
    });
  }
}
