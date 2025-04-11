import { Component, NgModule } from '@angular/core';
import { DescuentoService } from '../../../services/descuento.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

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
      private toastr: ToastrService,
      private router: Router
  ) {}

  crearDescuento(): void {

    this.descuentoService.createDescuento(this.descuento).subscribe({
      next: () => {
      this.toastr.success('Descuento creado exitosamente', 'Éxito');
      this.router.navigate(['/descuento-dashboard'])

      },
      error: (err) => {
      this.toastr.error('Error al crear el descuento', 'Error');
      console.log(this.descuento)
      console.error(err);
      }
    });
  }

}
