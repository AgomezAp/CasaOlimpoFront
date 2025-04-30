import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  styleUrl: './receta.component.css',
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
  paginaActual: number = 1;
  elementosPorPagina: number = 5;
  totalRecetas: number = 0;
  paginatedRecetas: Receta[] = [];
  constructor(
    private formBuilder: FormBuilder,
    private recetaService: RecetaService,
    private notificacionService: NotificacionService
  ) {
    this.recetaForm = this.formBuilder.group({
      medicamentos: ['', Validators.required],
      instrucciones: ['', Validators.required],
      duracion_tratamiento: [''],
      diagnostico: ['', Validators.required],
      observaciones: [''],
      anotaciones: [''],
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
  get totalPaginas(): number {
    return Math.ceil(this.totalRecetas / this.elementosPorPagina);
  }
  
  // Navega a una página específica
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaActual) {
      this.actualizarPaginacion(pagina);
    }
  }
  
  // Navega a la página anterior
  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.actualizarPaginacion(this.paginaActual - 1);
    }
  }
  
  // Navega a la página siguiente
  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.actualizarPaginacion(this.paginaActual + 1);
    }
  }
  
  // Actualiza la paginación y las recetas a mostrar
  private actualizarPaginacion(pagina: number = this.paginaActual): void {
    if (pagina < 1) pagina = 1;
    if (this.totalPaginas > 0 && pagina > this.totalPaginas) pagina = this.totalPaginas;
    
    this.paginaActual = pagina;
    
    // Si no hay recetas, no hacemos nada más
    if (!this.recetas || this.recetas.length === 0) {
      this.paginatedRecetas = [];
      return;
    }
    
    // Calcular el total de recetas
    this.totalRecetas = this.recetas.length;
    
    // Calcular los índices para la página actual
    const inicio = (pagina - 1) * this.elementosPorPagina;
    const fin = Math.min(inicio + this.elementosPorPagina, this.totalRecetas);
    
    // Extraer solo las recetas para esta página
    this.paginatedRecetas = this.recetas.slice(inicio, fin);
  }
  cargarRecetas(): void {
    this.loading = true;
    this.error = '';

    this.recetaService.obtenerRecetasPorPaciente(this.pacienteId).subscribe({
      next: (response) => {
        this.recetas = response.data;
        this.loading = false;
        // Inicializar paginación en la primera página
        this.actualizarPaginacion(1);
      },
      error: (error) => {
        console.error('Error al cargar recetas:', error);
        this.error =
          'No se pudieron cargar las recetas. Por favor, intente nuevamente.';
        this.loading = false;
        this.notificacionService.error('Error al cargar recetas');
      },
    });
  }

  toggleFormularioReceta(): void {
    // Si hay recetas para este paciente
    if (this.recetas && this.recetas.length > 0) {
      const recetasOrdenadas = [...this.recetas].sort((a, b) => {
        const fechaA = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
        const fechaB = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
        return fechaB - fechaA;
      });
      const recetaMasReciente = recetasOrdenadas[0];
      if (recetaMasReciente.estado === 'ACTIVA') {
        this.notificacionService.warning(
          'No puedes crear una nueva receta hasta que la receta actual esté completada'
        );
        return; 
      }
    }
    this.mostrarFormularioReceta = !this.mostrarFormularioReceta;
    if (!this.mostrarFormularioReceta) {
      this.recetaForm.reset();
    }
  }
  tieneRecetaIncompleta(): boolean {
    if (!this.recetas || this.recetas.length === 0) {
      return false;
    }
    return this.recetas.some(receta => 
      receta.estado === 'ACTIVA'
    );
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
      anotaciones: this.recetaForm.value.anotaciones,
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
      },
    });
  }

  verDetalles(receta: Receta): void {
    this.recetaSeleccionada = receta;
  }

  cerrarModal(): void {
    this.recetaSeleccionada = null;
  }

  completarReceta(receta: Receta): void {
    const motivo = prompt(
      'Por favor, ingrese el motivo para completar esta receta:'
    );

    if (motivo === null) return; // Usuario canceló

    this.recetaService.completarReceta(receta.RecetaId!, motivo).subscribe({
      next: (response) => {
        const index = this.recetas.findIndex(
          (r) => r.RecetaId === receta.RecetaId
        );
        if (index !== -1) {
          this.recetas[index] = response.data;
        }
        this.actualizarPaginacion();
        this.notificacionService.success('Receta marcada como completada');
      },
      error: (error) => {
        console.error('Error al completar receta:', error);
        this.notificacionService.error('No se pudo completar la receta');
      },
    });
  }

  descargarPDF(receta: Receta): void {
    this.notificacionService.info('Generando PDF...');
  
    try {
      // Crear un nuevo documento PDF
      const doc = new jsPDF();
      const logoDoradoBase64 = 'assets/LogoDorado.png'; 
      const logoGrisBase64 = 'assets/SimboloGrisOscuro.webp'; 
      const iconoTelefono = 'assets/telefono.png';
      const iconoWeb = 'assets/web.png';
      const iconoEmail = 'assets/email.png'; 
      const iconoUbicacion = 'assets/ubicacion.png';
      
      // Función para aplicar opacidad (sin cambios)
      const aplicarOpacidad = (
        base64Img: string,
        opacidad: number
      ): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.globalAlpha = opacidad;
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            }
          };
          img.src = base64Img;
        });
      };
  
      // Generar PDF con los logos
      Promise.resolve().then(async () => {
        // 1. Marca de agua con opacidad
        const logoGrisConOpacidad = await aplicarOpacidad(logoGrisBase64, 0.1);
        doc.addImage(logoGrisConOpacidad, 'PNG', 55, 120, 100, 100);
        
        // 2. Logo principal - sin cambios
        doc.addImage(logoDoradoBase64, 'PNG', 75, 15, 60, 25);
        
        // 3. Configuración de texto - sin cambios
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(12);
        let y = 60;
  
        // Fecha y médico - sin cambios
        doc.setFontSize(11);
        doc.text(`Fecha: ${this.formatFecha(receta.fecha_creacion || new Date())}`, 15, y);
        doc.text(`Médico: ${this.getNombreDoctor(receta)}`, 120, y);
        y += 25;
  
        // Diagnóstico - sin cambios
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnóstico', 15, y);
        doc.setFont('helvetica', 'normal');
        doc.text(receta.diagnostico || '', 80, y);
        y += 20;
        
        // Título para la tabla - sin cambios
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('MEDICAMENTOS E INDICACIONES', 15, y);
        y += 10;
  
        // 4. Tabla - sin cambios
        autoTable(doc, {
          startY: y,
          head: [['Medicamentos', 'Instrucciones', 'Duración']],
          body: [
            [
              receta.medicamentos || '',
              receta.instrucciones || '',
              receta.duracion_tratamiento || '',
            ],
          ],
          headStyles: {
            fillColor: [207, 181, 111],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
          },
          bodyStyles: {
            fillColor: [245, 245, 245],
            textColor: [50, 50, 50],
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 85 },
            2: { cellWidth: 30 },
          },
          margin: { left: 15, right: 15 },
          tableWidth: 'auto',
        });
  
        // Actualizar posición Y después de la tabla - REDUCIDO ESPACIO
        y = (doc as any).lastAutoTable.finalY + 15; // Cambié de +20 a +15
  
        // Observaciones
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones', 15, y);
        doc.setFont('helvetica', 'normal');
        doc.text(receta.observaciones || '', 15, y + 10);
  
        // 5. Firma del médico - SUBIDA A UNA POSICIÓN RELATIVA
        const firmaY = y + 35; // Ahora calculamos basado en la posición de observaciones
        doc.line(150, firmaY, 190, firmaY);
        doc.text('Firma', 170, firmaY + 10);
  
        // 6. Pie de página con datos de contacto - SUBIDO PARA REDUCIR ESPACIO
        doc.setFontSize(8);
        try {
          // Subimos todo el pie de página
          const baseY = firmaY + 25; // Basado en la posición de la firma
          
          // Primera fila: teléfono y web
          doc.addImage(iconoTelefono, 'PNG', 20, baseY, 8, 8);
          doc.text('+57 320 676 9628', 30, baseY + 4);
          
          doc.addImage(iconoWeb, 'PNG', 100, baseY, 8, 8);
          doc.text('www.casaolimpo.com', 110, baseY + 4);
          
          // Segunda fila: email y ubicación
          const secondRowY = baseY + 15;
          doc.addImage(iconoEmail, 'PNG', 20, secondRowY, 8, 8);
          doc.text('casaolimpopr@gmail.com', 30, secondRowY + 4);
          
          doc.addImage(iconoUbicacion, 'PNG', 100, secondRowY, 8, 8);
          doc.text('Cra 16 Bis #11-15, Pereira, Risaralda', 110, secondRowY + 4);
        } catch (e) {
          // Respaldo sin iconos - también subido
          console.error('Error al cargar iconos:', e);
          const baseY = firmaY + 25;
          doc.text('+57 320 676 9628', 20, baseY);
          doc.text('www.casaolimpo.com', 100, baseY);
          doc.text('casaolimpopr@gmail.com', 20, baseY + 15);
          doc.text('Cra 16 Bis #11-15, Pereira, Risaralda', 100, baseY + 15);
        }
  
        // Guardar el PDF - sin cambios
        const nombreArchivo = `Receta_${
          this.pacienteId || 'Paciente'
        }_${new Date().getTime()}.pdf`;
        doc.save(nombreArchivo);
        this.notificacionService.success('PDF generado exitosamente');
      });
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
      minute: '2-digit',
    });
  }

  getNombreDoctor(receta: Receta): string {
    if (receta.doctor) {
      return `${receta.doctor.nombre}`;
    }
    return 'Médico no especificado';
  }
}
