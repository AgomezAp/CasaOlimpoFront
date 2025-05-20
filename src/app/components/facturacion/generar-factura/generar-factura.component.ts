import { Component } from '@angular/core';
import { FacturacionService } from '../../../services/facturacion.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DescuentoService } from '../../../services/descuento.service';
import { CommonModule } from '@angular/common';
import { NotificacionService } from '../../../services/notificacion.service';
import { NgSelectModule } from '@ng-select/ng-select';
@Component({
  selector: 'app-generar-factura',
  imports: [FormsModule, CommonModule, NgSelectModule],
  templateUrl: './generar-factura.component.html',
  styleUrl: './generar-factura.component.css'
})
export class GenerarFacturaComponent {
  paciente: any;
  loading: boolean = false;
  precio: number = 0;
  descuento: any = 0;
  procedimiento: string = ''; 
  total: number = 0;
  tipoPago: string = 'Efectivo';
  descuentos: any[] = [];
  factura: any = {};
  constructor(
    private facturacionService: FacturacionService,
    private router: Router,
    private descuentoService: DescuentoService,
    private notificacionService: NotificacionService,
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
  goBack(): void {
    this.router.navigate(['/factura-dashboard']); 
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
  let descuentoAplicado = 0;
  if (this.descuento && this.descuento.toString().includes('%')) {
    const porcentaje = parseFloat(this.descuento.replace('%','')) || 0;
    descuentoAplicado = this.precio * (porcentaje / 100);
  } else {
    descuentoAplicado = parseFloat(this.descuento) || 0;
  }
  this.total = Math.max(0, this.precio - descuentoAplicado);
}

  // agregarNuevo(valor: string): void {
  //   if (!this.descuentos.find(d => d.porcentaje === valor)) {
  //     this.descuentos.push({ motivo_descuento: 'Descuento personalizado', porcentaje: valor });
  //   }
  // }
  crearFactura(): void {
    this.loading = true
    const facturadata = {
      numero_documento: this.paciente.numero_documento,
      tipo_pago: this.tipoPago,
      total: this.total,
      procedimiento : this.procedimiento
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
        this.loading = false
      },
      error: (err) => {
        console.error('Error al crear la factura:', err);
        this.notificacionService.error('No se pudo crear la factura');
        this.loading = false
      }
    });
  }

}
