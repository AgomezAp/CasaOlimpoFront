import { Component } from '@angular/core';
import { PacienteService } from '../../../services/paciente.service';
import { Router } from '@angular/router';
import { FacturacionService } from '../../../services/facturacion.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-factura-id',
  imports: [CommonModule, FormsModule],
  templateUrl: './factura-id.component.html',
  styleUrl: './factura-id.component.css'
})
export class FacturaIdComponent {
  facturas: any[] = [];
  facturasPaginadas: any[] = [];
  searchTerm: string = '';
  paginaActual: number = 1;
  totalPaginas: number = 1;
  loading: boolean = false;
  error: string | null = null;
  constructor(
    private pacienteService: PacienteService,
    private router: Router,
    private facturaService: FacturacionService
  ) {}
  ngOnInit(): void {
    this.cargarFacturas();
  }

  cargarFacturas(): void {
    this.loading = true;
    this.facturaService.facturaId().subscribe({
      next: (data: any) => {
        this.facturas = data;
        this.actualizarPaginacion();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar las facturas:', err);
        this.error = 'No se pudieron cargar las facturas.';
        this.loading = false;
      }
    });
  }

  filtrarFacturas(): void {
    const term = this.searchTerm.toLowerCase();
    const facturasFiltradas = this.facturas.filter(factura =>
      factura.numeroFactura.toString().includes(term) ||
      factura.fecha.toLowerCase().includes(term) ||
      factura.monto.toString().includes(term)
    );
    this.actualizarPaginacion(facturasFiltradas);
  }

  actualizarPaginacion(facturas?: any[]): void {
    const itemsPorPagina = 10;
    const lista = facturas || this.facturas;
    this.totalPaginas = Math.ceil(lista.length / itemsPorPagina);
    const inicio = (this.paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    this.facturasPaginadas = lista.slice(inicio, fin);
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

  irAPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  verFactura(factura: any): void {
    console.log('Ver factura:', factura);
    // Implementa la lógica para ver la factura
  }

  imprimirFactura(factura: any): void {
    console.log('Imprimir factura:', factura);
    // Implementa la lógica para imprimir la factura
  }
}
