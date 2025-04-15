import { Component, OnInit } from '@angular/core';
import { PacienteService } from '../../../services/paciente.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Paciente } from '../../../interfaces/paciente';
import { NotificacionService } from '../../../services/notificacion.service';

@Component({
  selector: 'app-paciente-dashboard',
  imports: [CommonModule,FormsModule],
  templateUrl: './paciente-dashboard.component.html',
  styleUrl: './paciente-dashboard.component.css'
})
export class PacienteDashboardComponent implements OnInit {
  // Propiedades existentes
  pacientes: any[] = [];
  pacientesTodos: any[] = [];
  pacientesPaginados: any[] = [];
  loading: boolean = false;
  error: string = '';
  searchTerm: string = '';
  
  // Propiedades para paginación
  paginaActual: number = 1;
  pacientesPorPagina: number = 5;
  totalPaginas: number = 1;
  
  // Para usar Math en el template
  Math = Math;

  constructor(
    private pacienteService: PacienteService,
    private router: Router,
    private notificacionService: NotificacionService
  ) { }

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.loading = true;
    this.error = '';
    
    this.pacienteService.obtenerPacientesPorDoctor().subscribe({
      next: (response) => {
        console.log('Respuesta recibida:', response);
        
        if (response && response.data) {
          // Comprobar si response.data es un array (ya transformado por el servicio)
          if (Array.isArray(response.data)) {
            this.pacientesTodos = response.data;
            this.pacientes = [...this.pacientesTodos];
            
            // Mostrar información del doctor si está disponible
            if (response.doctorInfo) {
              console.log(`Cargados ${this.pacientes.length} pacientes del Dr. ${response.doctorInfo.nombre}`);
              this.notificacionService.success(`${response.doctorInfo.totalPacientes} pacientes encontrados`);
            } else {
              this.notificacionService.success(`${this.pacientes.length} pacientes encontrados`);
            }
          } 
          // Si se mantiene la estructura original del API
          else if (response.data.pacientes && Array.isArray(response.data.pacientes)) {
            this.pacientesTodos = response.data.pacientes;
            this.pacientes = [...this.pacientesTodos];
            console.log(`Cargados ${this.pacientes.length} pacientes del Dr. ${response.data.doctor}`);
            this.notificacionService.success(`${response.data.total_pacientes} pacientes encontrados`);
          } 
          // Si no hay pacientes bajo ninguna estructura
          else {
            this.pacientesTodos = [];
            this.pacientes = [];
            console.warn('No se encontraron pacientes en la respuesta:', response.data);
            this.notificacionService.warning('No se encontraron pacientes para este doctor');
          }
          this.actualizarPaginacion();
        } else {
          this.pacientesTodos = [];
          this.pacientes = [];
          this.notificacionService.warning('No se encontraron datos para este doctor');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando pacientes:', error);
        this.error = 'Ocurrió un error al cargar los pacientes. Por favor, intente nuevamente.';
        this.loading = false;
        this.notificacionService.error('Error al cargar pacientes');
      }
    });
  }
  
  cargarTodosPacientes(): void {
    this.loading = true;
    this.pacienteService.obtenerPacientes().subscribe({
      next: (response: any) => {
        console.log('Respuesta de todos los pacientes:', response);
        
        // Verificar diferentes estructuras posibles de respuesta
        if (Array.isArray(response)) {
          this.pacientes = response;
        } else if (response && response.data) {
          // Verificar si es el nuevo formato con data.pacientes
          if (response.data.pacientes && Array.isArray(response.data.pacientes)) {
            this.pacientes = response.data.pacientes;
          } 
          // Verificar si data es directamente un array
          else if (Array.isArray(response.data)) {
            this.pacientes = response.data;
          } 
          // Si no es ninguno de los formatos esperados
          else {
            this.pacientes = [];
            this.notificacionService.warning('Formato de datos incorrecto');
          }
        } else {
          this.pacientes = [];
          this.notificacionService.warning('No se recibieron datos de pacientes');
        }
        
        this.pacientesTodos = [...this.pacientes];
        this.actualizarPaginacion();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar todos los pacientes:', error);
        this.notificacionService.error('Error al cargar todos los pacientes');
        this.loading = false;
      }
    });
  }

  // Método para paginar los resultados
  actualizarPaginacion(): void {
    // Calcular total de páginas
    this.totalPaginas = Math.ceil(this.pacientes.length / this.pacientesPorPagina);
    
    // Si la página actual ya no es válida (por ejemplo, al filtrar)
    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = this.totalPaginas;
    } else if (this.totalPaginas === 0) {
      this.paginaActual = 1; // Si no hay resultados, mantener en página 1
    }
    
    // Obtener pacientes para la página actual
    const startIndex = (this.paginaActual - 1) * this.pacientesPorPagina;
    this.pacientesPaginados = this.pacientes.slice(
      startIndex, 
      startIndex + this.pacientesPorPagina
    );
    
    console.log(`Paginación: Página ${this.paginaActual} de ${this.totalPaginas}`);
    console.log(`Mostrando ${this.pacientesPaginados.length} de ${this.pacientes.length} pacientes`);
  }

  // Métodos de navegación de páginas
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  anteriorPagina(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  siguientePagina(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  // Actualizar el método de filtración para incluir paginación
  filtrarPacientes(): void {
    if (!this.searchTerm.trim()) {
      this.pacientes = [...this.pacientesTodos];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.pacientes = this.pacientesTodos.filter(p => 
        p.nombre?.toLowerCase().includes(term) ||
        p.apellidos?.toLowerCase().includes(term) ||
        p.numero_documento?.toString().includes(term)
      );
    }
    
    // Reiniciar a la primera página al filtrar
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  // Genera un array para usar en el ngFor de páginas
  getPaginasVisibles(): number[] {
    const paginas: number[] = [];
    const totalBotones = 5; // Número de botones de página a mostrar
    let inicio = Math.max(1, this.paginaActual - Math.floor(totalBotones/2));
    let fin = Math.min(this.totalPaginas, inicio + totalBotones - 1);
    
    // Ajustar cuando estamos cerca del final
    if (fin - inicio + 1 < totalBotones) {
      inicio = Math.max(1, fin - totalBotones + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  // Otros métodos existentes
  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return edad;
  }

  nuevoPaciente(): void {
    this.router.navigate(['agregar-paciente']);
  }

  editarPaciente(paciente: any): void {
    this.router.navigate(['/paciente/editar', paciente.numero_documento]);
  }
  
  verPaciente(paciente: any): void {
    this.router.navigate(['info-paciente', paciente.numero_documento]);
  }
}