import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  constructor(private router: Router) { }
  menuItems = [
    { path: '/agenda', label: 'Agenda', icon: 'calendar' },
    { path: '/paciente-dashboard', label: 'Pacientes', icon: 'people' },
    { path: '/cumpleaños', label: 'Cumpleaños', icon: 'cake' },
    { path: '/descuentos', label: 'Descuentos', icon: 'discount' },
    { path: '/factura-dashboard', label: 'Facturación', icon: 'receipt' },
    { path: '/logout', label: 'Salir', icon: 'logout' }
  ];
  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('nombreCompleto');
    
    // Redireccionar al login
    this.router.navigate(['/login']);
  }
}
