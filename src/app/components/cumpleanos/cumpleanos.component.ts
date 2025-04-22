import { Component, OnInit } from '@angular/core';
import { CumpleanosService } from '../../services/cumpleanos.service'
import { dash } from 'pdfkit';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

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

  constructor(private cumpleService: CumpleanosService, private toastr: ToastrService)  {}

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
    const dataActual = (document.getElementById('hora') as HTMLInputElement)?.value || '';
    console.log(dataActual)
    this.cumpleService.obtenerMensaje({mensaje : this.mensaje, hora: this.hora}).subscribe({
      next: () => {
        const horaActual = new Date();
        console.log(horaActual)
        const [hora, minutos] = this.hora.split(':').map(Number);
        console.log(hora, minutos)
        console.log(this.hora)
        const horaSeleccionada = new Date();
        horaSeleccionada.setHours(hora, minutos, 0);
        console.log(horaSeleccionada)
        if (horaSeleccionada <= horaActual) {
          this.toastr.error('La hora seleccionada debe ser mayor a la hora actual', 'Error');
          return;
        }
        console.log('Datos guardados exitosamente')
        this.toastr.success('Mensaje actualizado correctamente', 'Éxito');
        
      },
      error: (err) => {
        console.error('Error al guardar los datos: ', err)
      }
    });
  }

  mensajeEstablecido(): void {
    this.cumpleService.mensaje({}).subscribe({
      next: (data) => {
        this.mensaje = data.mensaje
        this.hora = data.hora
        console.log("LLEGANDO",this.mensaje, this.hora)
        this.toastr.success('Mensaje Obtenido')
      },
      error: (err) => {
        console.error('Error al obtener')
      }
    })
  }

}
