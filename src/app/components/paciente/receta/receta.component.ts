import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Receta } from '../../../interfaces/receta';
import { ActivatedRoute } from '@angular/router';
import { RecetaService } from '../../../services/receta.service';
import { NotificacionService } from '../../../services/notificacion.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    private notificacionService: NotificacionService,
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
        this.notificacionService.error('Error al cargar recetas');
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
        this.notificacionService.success('Receta guardada exitosamente');
      },
      error: (error) => {
        console.error('Error al guardar receta:', error);
        this.submitting = false;
        this.notificacionService.error('No se pudo guardar la receta');
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
        this.notificacionService.success('Receta marcada como completada');
      },
      error: (error) => {
        console.error('Error al completar receta:', error);
        this.notificacionService.error('No se pudo completar la receta');
      }
    });
  }

  descargarPDF(receta: Receta): void {
    this.notificacionService.info('Generando PDF...');
    
    try {
      // Crear un nuevo documento PDF
      const doc = new jsPDF();
      
      // Configuración de la página
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('RECETA MÉDICA', 105, 20, { align: 'center' });
      
      // Logo o encabezado (opcional)
      // doc.addImage("logo.png", "PNG", 10, 10, 50, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      
      // Datos del paciente
      doc.text('DATOS DEL PACIENTE', 15, 40);
      doc.setFontSize(10);
      doc.text(`ID: ${this.pacienteId}`, 15, 48);
      // Si tienes más datos del paciente, agrégalos aquí
      
      // Datos del médico
      doc.setFontSize(12);
      doc.text('MÉDICO TRATANTE', 15, 65);
      doc.setFontSize(10);
      doc.text(`${this.getNombreDoctor(receta)}`, 15, 73);
      
      // Fecha de emisión
      doc.text(`Fecha: ${this.formatFecha(receta.fecha_creacion || new Date())}`, 15, 83);
      
      // Diagnóstico
      doc.setFontSize(12);
      doc.text('DIAGNÓSTICO', 15, 100);
      doc.setFontSize(10);
      doc.text(`${receta.diagnostico || 'No especificado'}`, 15, 108);
      
      // Medicamentos
      doc.setFontSize(12);
      doc.text('MEDICAMENTOS E INDICACIONES', 15, 125);
      doc.setFontSize(10);
      
      // Usar autoTable para mostrar los medicamentos de manera ordenada
      autoTable(doc, {
        startY: 130,
        head: [['Medicamentos', 'Instrucciones', 'Duración']],
        body: [
          [
            receta.medicamentos || 'No especificado', 
            receta.instrucciones || 'No especificado', 
            receta.duracion_tratamiento || 'No especificado'
          ]
        ],
      });
      
      // Observaciones
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('OBSERVACIONES', 15, finalY);
      doc.setFontSize(10);
      doc.text(`${receta.observaciones || 'Sin observaciones adicionales'}`, 15, finalY + 8);
      
      // Pie de página - firma del médico
      doc.setFontSize(10);
      doc.text('_______________________________', 130, 250);
      doc.text('Firma del médico', 140, 258);
      
      // Guardar el PDF
      const nombreArchivo = `Receta_${this.pacienteId}_${new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);
      
      this.notificacionService.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.notificacionService.error('No se pudo generar el PDF');
    }
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
      return `${receta.doctor.nombre}`;
    }
    return 'Médico no especificado';
  }
  
}