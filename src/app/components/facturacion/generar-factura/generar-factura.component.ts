import { Component } from '@angular/core';
import { FacturacionService } from '../../../services/facturacion.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DescuentoService } from '../../../services/descuento.service';
import { CommonModule } from '@angular/common';
import { NotificacionService } from '../../../services/notificacion.service';
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
  tipoPago: string = 'Efectivo';
  descuentos: any[] = [];
  factura: any = {} 
  constructor(
    private facturacionService: FacturacionService,
    private router: Router,
    private descuentoService: DescuentoService,
    private notificacionService: NotificacionService
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
        this.notificacionService.error('No se cargaron los descuentos')
      }
    });
  }

  calcularTotal(): void {
    this.total = Math.max(0, this.precio - (this.precio * (this.descuento / 100)));
  }

  crearFactura(): void {
    const facturadata = {
      numero_documento: this.paciente.numero_documento,
      tipo_pago: this.tipoPago,
      total: this.total
    };
    console.log(facturadata)
    this.facturacionService.crearFactura(facturadata).subscribe({
      next: (response) => {
        const blob = new Blob([response],{type: 'application/pdf'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a')
        a.href = url;
        a.download = `factura_${facturadata.numero_documento}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificacionService.success('Factura creada exitosamente');
        console.log('Factura creada:', facturadata);
        this.router.navigate(['/factura-dashboard']); // Redirige al dashboard después de crear la factura
      },
      error: (err) => {
        console.error('Error al crear la factura:', err);
        this.notificacionService.error('No se pudo crear la factura');
      }
    });
  }

}
