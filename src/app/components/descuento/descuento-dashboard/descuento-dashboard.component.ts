import { Component } from '@angular/core';
import { DescuentoService } from '../../../services/descuento.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificacionService } from '../../../services/notificacion.service';
@Component({
  selector: 'app-descuento-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './descuento-dashboard.component.html',
  styleUrl: './descuento-dashboard.component.css'
})
export class DescuentoDashboardComponent {
  descuento: any[] = []
  descuentoSeleccionado: any = null
  constructor(
    private descuentoService: DescuentoService,
    private router: Router,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    this.getDescuentos()
  }

  getDescuentos(): void {
    this.descuentoService.getDescuentos().subscribe({
      next: (response: any) => {
        this.descuento = Array.isArray(response) ? response: response.descuentos || [];
        this.descuento = this.descuento.map(d => ({
          ...d,
          fecha_inicio: this.formatearFecha(d.fecha_inicio),
          fecha_fin: this.formatearFecha(d.fecha_fin),
        }));
        console.log(response)
        console.log(this.descuento);
      },
      error: (err) => {
        this.notificacionService.error('Error al obtener los descuentos')
        console.error(err)
      }
    })
  }

  private formatearFecha(fecha: string): string {
    const date = new Date(fecha)
    const mes = String(date.getMonth()+1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    const anio = date.getFullYear();
    return `${anio}-${mes}-${dia}`
  }

  deleteDescuento(Did: number): void {
    this.descuentoService.deleteDescuento(Did).subscribe({
      next: () => {
        this.notificacionService.success('Descuento eliminado correctamente');
        this.getDescuentos();
      },
      error: (err) => {
        this.notificacionService.error('Error al eliminar el descuento');
        console.error(err);
      }
    });
  }

  abrirModalEditar(descuento: any): void {
    console.log(descuento)
    this.descuentoSeleccionado = { ...descuento};
  }

  cerrarModal(): void {
    this.descuentoSeleccionado = null;
  }

  guardarEdicion(): void {
    if(this.descuentoSeleccionado) {
      console.log(this.descuentoSeleccionado)
      this.descuentoService.updateDescuento(this.descuentoSeleccionado.Did, this.descuentoSeleccionado).subscribe({
        next: () => {
          this.notificacionService.success('Descuento actualizado correctamente');
          this.getDescuentos();
          this.cerrarModal();
        },
        error: (err) => {
          this.notificacionService.error('Error al actualizar el descuento')
          console.error(err);
        }
      })
    }
  }
  nuevoDescuento(): void {
    this.router.navigate(['/descuento'])
  }



}
