import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Receta } from '../../../interfaces/receta';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-receta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './receta.component.html',
  styleUrl: './receta.component.css'
})
export class RecetaComponent {
 /*  @Input() pacienteId: string = '';
  recetas: Receta[] = [];
  recetaSeleccionada: Receta | null = null;
  loading: boolean = false;
  error: string = '';
  recetaForm: FormGroup;
  submitting: boolean = false;
  mostrarFormularioReceta: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    // Asegúrate de crear y agregar un RecetaService
    // private recetaService: RecetaService
  ) {
    this.recetaForm = this.formBuilder.group({
      medicamento: ['', Validators.required],
      dosis: ['', Validators.required],
      duracion: [''],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params:any) => {
      this.pacienteId = params['id'];
      this.cargarRecetas();
    });
  }

  cargarRecetas(): void {
    this.loading = true;
    this.error = '';
    
    // Datos de ejemplo - reemplazar con llamada al servicio real
    setTimeout(() => {
      this.recetas = [
        {
          id: 1,
          pacienteId: this.pacienteId,
          fecha: '2025-03-15T10:30:00',
          profesional: 'Dr. Carlos Méndez',
          medicamento: 'Paracetamol 500mg',
          dosis: '1 tableta cada 8 horas',
          duracion: '5 días',
          observaciones: 'Tomar después de las comidas'
        },
        {
          id: 2,
          pacienteId: this.pacienteId,
          fecha: '2025-03-10T14:45:00',
          profesional: 'Dra. Laura Jiménez',
          medicamento: 'Ibuprofeno 400mg',
          dosis: '1 tableta cada 12 horas',
          duracion: '7 días',
          observaciones: 'No tomar con el estómago vacío'
        }
      ];
      this.loading = false;
    }, 1000);

    // Implementación real con el servicio
    /*
    this.recetaService.obtenerRecetasPorPaciente(this.pacienteId).subscribe({
      next: (response) => {
        this.recetas = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar recetas:', error);
        this.error = 'No se pudieron cargar las recetas. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
    
  }

  guardarReceta(): void {
    if (this.recetaForm.invalid) {
      return;
    }

    this.submitting = true;
    
    const nuevaReceta: Omit<Receta, 'id'> = {
      pacienteId: this.pacienteId,
      fecha: new Date().toISOString(),
      profesional: 'Dr. Actual', // Reemplazar con el usuario actual
      medicamento: this.recetaForm.value.medicamento,
      dosis: this.recetaForm.value.dosis,
      duracion: this.recetaForm.value.duracion,
      observaciones: this.recetaForm.value.observaciones
    };

    // Implementación con datos de ejemplo
    setTimeout(() => {
      // Simular ID generado por el servidor
      const recetaGuardada: Receta = {
        id: this.recetas.length + 1,
        ...nuevaReceta
      };
      
      this.recetas.unshift(recetaGuardada);
      this.submitting = false;
      this.mostrarFormularioReceta = false;
      this.recetaForm.reset();
      this.toastr.success('Receta guardada exitosamente', 'Éxito');
    }, 1500);

    // Implementación real con el servicio
    /*
    this.recetaService.crearReceta(nuevaReceta).subscribe({
      next: (response) => {
        this.cargarRecetas(); // Recargar todas las recetas
        // O simplemente agregar la nueva al arreglo local:
        // this.recetas.unshift(response.data);
        
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

  descargarPDF(receta: Receta): void {
    // Implementación para descargar PDF
    console.log('Descargar PDF para receta:', receta);
    this.toastr.info('Generando PDF...', 'Información');
    
    // Aquí iría la lógica para generar y descargar el PDF
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } 

*/
}