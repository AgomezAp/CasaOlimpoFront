import { Component, NgModule } from '@angular/core';
import { DescuentoService } from '../../../services/descuento.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NotificacionService } from '../../../services/notificacion.service';
@Component({
  selector: 'app-crear-descuento',
  imports: [FormsModule],
  templateUrl: './crear-descuento.component.html',
  styleUrl: './crear-descuento.component.css'
})
export class CrearDescuentoComponent {
  descuento: any = {} 
  constructor(
      private descuentoService: DescuentoService,
      private notificacionService: NotificacionService,
      private router: Router
  ) {}

  crearDescuento(): void {

    this.descuentoService.createDescuento(this.descuento).subscribe({
      next: () => {
      this.notificacionService.success('Descuento creado exitosamente');
      this.router.navigate(['/descuento-dashboard'])

      },
      error: (err) => {
      this.notificacionService.error('Error al crear el descuento');
      console.log(this.descuento)
      console.error(err);
      }
    });
  }

}
