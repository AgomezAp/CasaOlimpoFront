import { Component } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink } from '@angular/router';
import { ErrorsService } from '../../services/errors.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  correo: string = ''
  contrasena: string = ''
  loading: boolean = false

  constructor(private userService: LoginService,private toastr: ToastrService,private router:Router,private errorService:ErrorsService) { }
  logIn() {
    if (this.correo === '' || this.contrasena === '') {
      this.toastr.error('Todos los campos son obligatorios', 'Error');
      return;
    }

    const user = { correo: this.correo, contrasena: this.contrasena };
    this.loading = true;

    this.userService.iniciarSesion(user).subscribe({
      next: (response: any) => {
       
        const token = response.token;
        const Uid = response.Uid;
        const nombre =  response.nombre;
        this.loading = false;
        this.toastr.success('', 'Bienvenido');
        localStorage.setItem('token', token);
        localStorage.setItem('userId', Uid); 
        localStorage.setItem('nombreCompleto', nombre);
        console.log(response.nombre);
        this.router.navigate(['/paciente-dashboard']);
      },
      error: (e: HttpErrorResponse) => {
        this.loading = false;
        this.errorService.messageError(e);
      }
    });
  }

}
