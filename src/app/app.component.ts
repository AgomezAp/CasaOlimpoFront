import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NotificacionComponent } from './components/notificaciones/notificacion/notificacion.component';
import { CitaInminenteNotificationComponent } from './components/cita-inminente-notification/cita-inminente-notification.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,NavBarComponent,CommonModule,NotificacionComponent,CitaInminenteNotificationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'FrontEnd';
  showNavBar = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects;
        this.showNavBar = !['/','Login', '/register'].includes(currentUrl);
      });
  }
}