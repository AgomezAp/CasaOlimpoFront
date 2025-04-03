import { Component, OnInit } from '@angular/core';
import { PacienteService } from '../../../services/paciente.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  loading: boolean = false;
  error: string = '';
  searchTerm: string = '';
  
  // Propiedades para paginación
  paginaActual: number = 1;
  pacientesPorPagina: number = 7;
  totalPaginas: number = 1;
  pacientesPaginados: any[] = [];

  constructor(
    private pacienteService: PacienteService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.loading = true;
    this.error = '';
    
    this.pacienteService.obtenerPacientes().subscribe({
      next: (response: any) => {
        this.pacientesTodos = response.data || [];
        this.pacientes = [...this.pacientesTodos];
        this.actualizarPaginacion();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando pacientes:', error);
        this.error = 'Ocurrió un error al cargar los pacientes. Por favor, intente nuevamente.';
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
    }
    
    // Obtener pacientes para la página actual
    const startIndex = (this.paginaActual - 1) * this.pacientesPorPagina;
    this.pacientesPaginados = this.pacientes.slice(
      startIndex, 
      startIndex + this.pacientesPorPagina
    );
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
        p.nombre.toLowerCase().includes(term) ||
        p.apellidos.toLowerCase().includes(term) ||
        p.numero_documento?.toString().includes(term)
      );
    }
    
    // Reiniciar a la primera página al filtrar
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  // Otros métodos existentes...
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