import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../services/consulta.service';
import { NotificacionService } from '../../../services/notificacion.service';
import { Location } from '@angular/common';
@Component({
  selector: 'app-verdatosconsulta',
  imports: [CommonModule],
  templateUrl: './verdatosconsulta.component.html',
  styleUrl: './verdatosconsulta.component.css'
})
export class VerdatosconsultaComponent implements OnInit {
  numeroDocumento: string = '';
  consultaId: number = 0;
  consulta: any = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultaService: ConsultaService,
    private notificacionService: NotificacionService,
    private location: Location
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log('Params recibidos:', params); // Log para depuración
      
      this.numeroDocumento = params['numero_documento']; 
      this.consultaId = +params['consulta_id']; // Convertir a número
      
      console.log('Documento:', this.numeroDocumento, 'ID Consulta:', this.consultaId);
      
      if (this.numeroDocumento && !isNaN(this.consultaId)) {
        this.cargarConsulta();
      } else {
        this.notificacionService.error('Parámetros de consulta incorrectos');
        this.router.navigate(['/paciente-dashboard']); // Ruta segura para evitar bucles
      }
    });
  }
  
  cargarConsulta(): void {
    // Al iniciar la carga, asegurarnos que consulta sea null para mostrar el spinner
    this.consulta = null;
    
    this.consultaService.obtenerConsultaPaciente(this.numeroDocumento, this.consultaId)
      .subscribe({
        next: (data) => {
          // Simular un mínimo tiempo de carga para evitar parpadeos (opcional)
          setTimeout(() => {
            if (data) {
              this.consulta = data;
            } else {
              this.notificacionService.error('No se encontraron datos para esta consulta');
              this.router.navigate(['/paciente-dashboard']);
            }
          }, 300);
        },
        error: (error) => {
          this.notificacionService.error('Error al cargar la consulta');
          this.router.navigate(['/paciente-dashboard']);
        }
      });
  }
  volver(): void {
    this.location.back();
  }
}
