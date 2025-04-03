import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Receta } from '../../../interfaces/receta';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RecetaService } from '../../../services/receta.service';

@Component({
  selector: 'app-receta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './receta.component.html',
  styleUrl: './receta.component.css'
})
export class RecetaComponent implements OnInit, OnChanges {
  @Input() pacienteId: string = '';
  
  recetas: Receta[] = [];
  recetaSeleccionada: Receta | null = null;
  loading: boolean = false;
  error: string = '';
  recetaForm: FormGroup;
  submitting: boolean = false;
  mostrarFormularioReceta: boolean = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private recetaService: RecetaService,
    private toastr: ToastrService
  ) {
    this.recetaForm = this.formBuilder.group({
      medicamentos: ['', Validators.required],
      instrucciones: ['', Validators.required],
      duracion_tratamiento: [''],
      diagnostico: ['', Validators.required],
      observaciones: [''],
      anotaciones: ['']
    });
  }

  ngOnInit(): void {
    if (this.pacienteId) {
      this.cargarRecetas();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pacienteId'] && this.pacienteId) {
      this.cargarRecetas();
    }
  }

  cargarRecetas(): void {
    this.loading = true;
    this.error = '';
    
    this.recetaService.obtenerRecetasPorPaciente(this.pacienteId).subscribe({
      next: (response) => {
        this.recetas = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar recetas:', error);
        this.error = 'No se pudieron cargar las recetas. Por favor, intente nuevamente.';
        this.loading = false;
        this.toastr.error('Error al cargar recetas', 'Error');
      }
    });
  }
  
  toggleFormularioReceta(): void {
    this.mostrarFormularioReceta = !this.mostrarFormularioReceta;
    if (!this.mostrarFormularioReceta) {
      this.recetaForm.reset();
    }
  }
  
  cancelarFormulario(): void {
    this.mostrarFormularioReceta = false;
    this.recetaForm.reset();
  }

  guardarReceta(): void {
    if (this.recetaForm.invalid) {
      return;
    }
  
    this.submitting = true;
    
    // Preparamos sólo los datos necesarios para el backend, sin el numero_documento
    // ya que este va en la URL, no en el body
    const datosReceta = {
      Uid: 1, // Este debería ser el ID del usuario autenticado
      medicamentos: this.recetaForm.value.medicamentos,
      instrucciones: this.recetaForm.value.instrucciones,
      duracion_tratamiento: this.recetaForm.value.duracion_tratamiento,
      diagnostico: this.recetaForm.value.diagnostico,
      observaciones: this.recetaForm.value.observaciones,
      anotaciones: this.recetaForm.value.anotaciones
    };
  
    // Ahora pasamos el numero_documento como un parámetro separado
    this.recetaService.crearReceta(this.pacienteId, datosReceta).subscribe({
      next: (response) => {
        this.recetas.unshift(response.data);
        this.submitting = false;
        this.mostrarFormularioReceta = false;
        this.recetaForm.reset();
        this.toastr.success('Receta guardada exitosamente', 'Éxito');
      },
      error: (error) => {
        console.error('Error al guardar receta:', error);
        this.submitting = false;
        this.toastr.error('No se pudo guardar la receta', 'Error');
      }
    });
  }

  verDetalles(receta: Receta): void {
    this.recetaSeleccionada = receta;
  }

  cerrarModal(): void {
    this.recetaSeleccionada = null;
  }

  completarReceta(receta: Receta): void {
    const motivo = prompt('Por favor, ingrese el motivo para completar esta receta:');
    
    if (motivo === null) return; // Usuario canceló
    
    this.recetaService.completarReceta(receta.RecetaId!, motivo).subscribe({
      next: (response) => {
        const index = this.recetas.findIndex(r => r.RecetaId === receta.RecetaId);
        if (index !== -1) {
          this.recetas[index] = response.data;
        }
        this.toastr.success('Receta marcada como completada', 'Éxito');
      },
      error: (error) => {
        console.error('Error al completar receta:', error);
        this.toastr.error('No se pudo completar la receta', 'Error');
      }
    });
  }

  descargarPDF(receta: Receta): void {
    this.toastr.info('Preparando PDF...', 'Información');
    
    // Implementación cuando exista el endpoint
    // this.recetaService.descargarPDF(receta.RecetaId!).subscribe({...});
    
    // Mientras tanto, mostrar mensaje
    setTimeout(() => {
      this.toastr.warning('Función en desarrollo', 'Descarga de PDF');
    }, 1500);
  }

  formatFecha(fecha: string | Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getNombreDoctor(receta: Receta): string {
    if (receta.doctor) {
      return `${receta.doctor.nombre} ${receta.doctor.apellido}`;
    }
    return 'Médico no especificado';
  }
}