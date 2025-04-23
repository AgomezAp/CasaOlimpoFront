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
  descuentoEditando: any = {};
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
    this.descuentoSeleccionado = descuento;
    // Crear una copia del descuento para editar
    this.descuentoEditando = {
      motivo: descuento.motivo_descuento,
      descuento: descuento.porcentaje,
      fecha_inicio: descuento.fecha_inicio,
      fecha_fin: descuento.fecha_fin,
      id: descuento.Did
    };
  }
  cerrarModal(): void {
    console.log('Cerrando modal...');
    this.descuentoSeleccionado = null;
    this.descuentoEditando = {};
    console.log('Modal cerrado, descuentoSeleccionado:', this.descuentoSeleccionado);
  }
  guardarCambios(): void {
    if (!this.validarFormulario()) return;
    
    const descuentoActualizado = {
      motivo_descuento: this.descuentoEditando.motivo,
      porcentaje: this.descuentoEditando.descuento,
      fecha_inicio: this.descuentoEditando.fecha_inicio,
      fecha_fin: this.descuentoEditando.fecha_fin
    };
    
    // Usar updateDescuento en lugar de actualizarDescuento
    this.descuentoService.updateDescuento(this.descuentoEditando.id, descuentoActualizado)
      .subscribe({
        next: () => {
          this.notificacionService.success('Descuento actualizado correctamente');
          this.cerrarModal();
          this.getDescuentos(); // Usar getDescuentos en lugar de cargarDescuentos
        },
        error: (error:any) => {
          console.error('Error al actualizar descuento:', error);
          this.notificacionService.error('Error al actualizar descuento');
        }
      });
  }
  nuevoDescuento(): void {
    this.router.navigate(['/descuento'])
  }

  validarFormulario(): boolean {
    if (!this.descuentoEditando.motivo || this.descuentoEditando.motivo.trim() === '') {
      this.notificacionService.error('El motivo del descuento es obligatorio');
      return false;
    }
    
    if (!this.descuentoEditando.descuento || isNaN(this.descuentoEditando.descuento) || 
        this.descuentoEditando.descuento <= 0 || this.descuentoEditando.descuento > 100) {
      this.notificacionService.error('El porcentaje de descuento debe ser un número entre 1 y 100');
      return false;
    }
    
    if (!this.descuentoEditando.fecha_inicio) {
      this.notificacionService.error('La fecha de inicio es obligatoria');
      return false;
    }
    
    if (!this.descuentoEditando.fecha_fin) {
      this.notificacionService.error('La fecha de fin es obligatoria');
      return false;
    }
    
    const fechaInicio = new Date(this.descuentoEditando.fecha_inicio);
    const fechaFin = new Date(this.descuentoEditando.fecha_fin);
    
    if (fechaFin < fechaInicio) {
      this.notificacionService.error('La fecha de fin no puede ser anterior a la fecha de inicio');
      return false;
    }
    
    return true;
  }

}
