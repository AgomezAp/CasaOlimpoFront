import { Component, OnInit } from '@angular/core';
import { CumpleanosService } from '../../services/cumpleanos.service'
import { dash } from 'pdfkit';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cumpleanos',
  imports: [CommonModule],
  templateUrl: './cumpleanos.component.html',
  styleUrl: './cumpleanos.component.css'
})
export class CumpleanosComponent implements OnInit {
  mensaje: string = "¡Feliz cumpleaños! En Casa Olimpo, celebramos contigo este día especial. Que la luz de tu sonrisa brille aún más fuerte y que cada deseo de tu corazón se haga realidad. ¡Te enviamos un abrazo lleno de energía positiva!";
  personas: any[] =[];

  constructor(private cumpleService: CumpleanosService) {}

  ngOnInit(): void {
    this.obtenerCumpleanos()

  }

  obtenerCumpleanos(): void {
    this.cumpleService.obtenerCumple({} as any).subscribe({
      next: (data) => {
        this.personas = data.pacientes.map((paciente: any) => ({
          nombre: `${paciente.nombre} ${paciente.apellidos}`,
          fecha_nacimiento: this.formatearFecha(paciente.fecha_nacimiento),
          edad: paciente.edad
        }));
        console.log(this.personas)
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
    return `${dia}-${mes}-${anio}`
  }

}
