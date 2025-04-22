import { Component, OnInit } from '@angular/core';
import { PacienteService } from '../../../services/paciente.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturacionService } from '../../../services/facturacion.service';

@Component({
  selector: 'app-factura-dashboard',
  imports: [CommonModule,FormsModule],
  templateUrl: './factura-dashboard.component.html',
  styleUrl: './factura-dashboard.component.css'
})
export class FacturaDashboardComponent implements OnInit {
  // Variables para pacientes
  pacientes: any[] = [];
  pacientesTodos: any[] = [];
  loading: boolean = false;
  error: string = '';
  searchTerm: string = '';
  
  // Variables para paginación
  paginaActual: number = 1;
  pacientesPorPagina: number = 7;
  totalPaginas: number = 1;
  pacientesPaginados: any[] = [];

  constructor(
    private pacienteService: PacienteService,
    private router: Router,
    private facturaService: FacturacionService
  ) { }

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.loading = true;
    this.error = '';
    
    this.pacienteService.obtenerPacientes().subscribe({
      next: (response: any) => {
        // Extrayendo el array desde la propiedad 'data' de la respuesta
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

  actualizarPaginacion(): void {
    // Calcular total de páginas
    this.totalPaginas = Math.ceil(this.pacientes.length / this.pacientesPorPagina);
    
    // Si la página actual ya no es válida
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

  filtrarFacturas(): void {
    if (!this.searchTerm.trim()) {
      this.pacientes = [...this.pacientesTodos];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.pacientes = this.pacientesTodos.filter(p => 
        p.nombre.toLowerCase().includes(term) ||
        p.apellidos.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.telefono?.includes(term) ||
        p.numero_documento?.includes(term)
      );
    }
    
    // Reiniciar a la primera página al filtrar
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  generarFactura(paciente: any): void {
    // Aquí implementarías la lógica para generar la factura
    console.log('Generando factura para paciente:', paciente);
    this.facturaService.paciente = paciente;
    this.router.navigate(['/factura-generar'])
  }

  verFacturas(): void {
    this.router.navigate(['/facturas']);
  }

}
