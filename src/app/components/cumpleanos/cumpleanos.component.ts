import { Component, OnInit } from '@angular/core';
import { CumpleanosService } from '../../services/cumpleanos.service'
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificacionService } from '../../services/notificacion.service'
@Component({
  selector: 'app-cumpleanos',
  imports: [CommonModule, FormsModule],
  templateUrl: './cumpleanos.component.html',
  styleUrl: './cumpleanos.component.css'
})
export class CumpleanosComponent implements OnInit {
  // mensaje: string = "¡Feliz cumpleaños! En Casa Olimpo, celebramos contigo este día especial. Que la luz de tu sonrisa brille aún más fuerte y que cada deseo de tu corazón se haga realidad. ¡Te enviamos un abrazo lleno de energía positiva!";
  mensaje: string = (document.getElementById('mensaje') as HTMLInputElement)?.value || '';
  hora: string = '';
  personas: any[] =[];

  constructor(
    private cumpleService: CumpleanosService,
    private notificacionService: NotificacionService)  {}

  ngOnInit(): void {
    this.mensajeEstablecido()
    this.obtenerCumpleanos()
  }

  obtenerCumpleanos(): void {
    this.cumpleService.obtenerCumple({} as any).subscribe({
      next: (data) => {
        if (data && data.pacientes) {
          this.personas = data.pacientes.map((paciente: any) => ({
            nombre: `${paciente.nombre} ${paciente.apellidos}`,
            fecha_nacimiento: this.formatearFecha(paciente.fecha_nacimiento),
            edad: paciente.edad
          }));
          console.log(this.personas)
        } else {
          this.personas = []
        }
      },
      error: (err) => {
        console.error('Error al obtener los cumpleaños', err);
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

  enviarMensaje(): void {
    this.cumpleService.obtenerMensaje({mensaje : this.mensaje}).subscribe({
      next: () => {
        console.log('Datos guardados exitosamente')
        this.notificacionService.success('Mensaje actualizado correctamente');
        
      },
      error: (err) => {
        console.error('Error al guardar los datos: ', err)
        this.notificacionService.error('No se pudo guardar el mensaje');
      }
    });
  }

  mensajeEstablecido(): void {
    this.cumpleService.mensaje({}).subscribe({
      next: (data) => {
        this.mensaje = data.mensaje
        this.hora = data.hora
        console.log("LLEGANDO",this.mensaje, this.hora)
      },
      error: (err) => {
        console.error('Error al obtener')
      }
    })
  }

}
