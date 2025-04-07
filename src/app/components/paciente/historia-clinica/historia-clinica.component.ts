import { Component, Input, OnInit } from '@angular/core';
import { Consulta } from '../../../interfaces/consulta';
import { ConsultaService } from '../../../services/consulta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule,],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})
export class HistoriaClinicaComponent implements OnInit{
  @Input() pacienteId: string = '';
  consultas: Consulta[] = [];
  cargando: boolean = true;
  error: string | null = null;
  numeroDocumento: string = '';
  fechaCreacionHistoria: Date | null = null;
  tieneConsultaAbierta: boolean = false;
  
  constructor(
    private consultaService: ConsultaService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Obtener el número de documento del paciente de la URL
    this.route.parent?.params.subscribe(params => {
      this.numeroDocumento = params['numero_documento'];
      if (this.numeroDocumento) {
        this.cargarConsultas();
      } else {
        // Último intento: verificar si hay un parámetro en la URL actual
        this.route.params.subscribe(routeParams => {
          this.numeroDocumento = routeParams['numero_documento'];
          if (this.numeroDocumento) {
            this.cargarConsultas();
          } else {
            this.error = 'No se pudo identificar al paciente';
            this.cargando = false;
          }
        });
      }
    });
  }

  cargarConsultas(): void {
    this.cargando = true;
    this.consultaService.obtenerConsultasPorPaciente(this.numeroDocumento)
      .subscribe({
        next: (response) => {
          this.consultas = response.data || [];
          this.cargando = false;
          
          // Ordenar por fecha
          this.consultas.sort((a, b) => 
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          
          // Obtener la fecha de la primera historia (la más antigua)
          if (this.consultas.length > 0) {
            const consultasOrdenadas = [...this.consultas].sort((a, b) => 
              new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
            );
            this.fechaCreacionHistoria = new Date(consultasOrdenadas[0].fecha);
          }
          
          // Verificar si existe alguna consulta abierta
          this.tieneConsultaAbierta = this.consultas.some(consulta => consulta.abierto);
        },
        error: (err) => {
          this.error = 'Error al cargar las historias clínicas: ' + 
                      (err.message || 'Error desconocido');
          this.cargando = false;
        }
      });
  }

  formatearFecha(fecha: Date): string {
    return this.consultaService.formatearFecha(fecha);
  }

  nuevaConsulta(): void {
    if (this.tieneConsultaAbierta) {
      alert('Debe cerrar la historia clínica actual antes de crear una nueva.');
      return;
    }
    
    // Usar la ruta definida en app.routes.ts
    this.router.navigate(['/crear-consulta', this.numeroDocumento]);
  }

  editarConsulta(consulta: Consulta): void {
    this.router.navigate(['/paciente', this.numeroDocumento, 'consulta', consulta.Cid, 'editar']);
  }
  
  verDetalles(consulta: Consulta): void {
    this.router.navigate(['/paciente', this.numeroDocumento, 'consulta', consulta.Cid]);
  }
  cerrarConsulta(consulta: Consulta): void {
    if (!consulta.abierto) {
      return; // No hacer nada si ya está cerrada
    }
    
    // Datos para el cierre de la consulta
    const datosCierre = {
      Uid: localStorage.getItem('userId') || '0' // Asumiendo que guardas el ID del usuario en localStorage
    };
  
    this.cargando = true; // Mostrar indicador de carga
    
    this.consultaService.cerrarConsulta(this.numeroDocumento, consulta.Cid, datosCierre)
      .subscribe({
        next: (response) => {
          // Actualizar la consulta localmente
          consulta.abierto = false;
          
          // Verificar si aún hay alguna consulta abierta
          this.tieneConsultaAbierta = this.consultas.some(c => c.abierto);
          
          this.cargando = false;
          alert('Historia clínica cerrada correctamente');
        },
        error: (err) => {
          console.error('Error al cerrar la consulta:', err);
          this.cargando = false;
          this.error = 'Error al cerrar la historia clínica: ' + 
                       (err.message || 'Error desconocido');
        }
      });
  }
}
