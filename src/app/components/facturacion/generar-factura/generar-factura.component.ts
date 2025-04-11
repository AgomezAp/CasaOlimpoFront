import { Component } from '@angular/core';
import { FacturacionService } from '../../../services/facturacion.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DescuentoService } from '../../../services/descuento.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generar-factura',
  imports: [FormsModule, CommonModule],
  templateUrl: './generar-factura.component.html',
  styleUrl: './generar-factura.component.css'
})
export class GenerarFacturaComponent {
  paciente: any;
  precio: number = 0;
  descuento: number = 0;
  total: number = 0;
  tipoPago: string = '';
  descuentos: any[] = [];

  constructor(
    private facturacionService: FacturacionService,
    private toastr: ToastrService,
    private router: Router,
    private descuentoService: DescuentoService
  ) {}

  ngOnInit(): void {
    this.paciente = this.facturacionService.paciente;
    if (!this.paciente){
      console.error('No se recibieron datoas')
      this.router.navigate(['/factura-dashboard']); 
    } else {
      console.log('Paciente recibido', this.paciente)
    }
    this.cargarDescuentos()
  }

  cargarDescuentos(): void {
    this.descuentoService.getDescuentos().subscribe({
      next: (data: any) => {
        console.log(data)
        this.descuentos = data.descuentos;
        console.log('Descuentos cargados: ', this.descuentos)
      },
      error: (err) => {
        console.error('Error al cargar', err);
        this.toastr.error('No se cargaron los descuentos')
      }
    });
  }

  calcularTotal(): void {
    this.total = Math.max(0, this.precio - (this.precio * (this.descuento / 100)));
  }

  crearFactura(): void {
    this.facturacionService.crearFactura().subscribe({
      next: () => {
        this.toastr.success('Factura creada')
      },
      error: (err) => {
        console.error('Error al crear', err);
        this.toastr.error('No se pudo crear')
      }
    })
  }

}
