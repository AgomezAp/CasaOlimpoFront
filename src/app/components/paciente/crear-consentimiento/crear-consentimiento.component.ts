import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Subscription } from 'rxjs';
import { ConsultaService } from '../../../services/consulta.service';
import { PacienteService } from '../../../services/paciente.service';

@Component({
  selector: 'app-crear-consentimiento',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-consentimiento.component.html',
  styleUrl: './crear-consentimiento.component.css',
})
export class CrearConsentimientoComponent {
  paciente: any = null;
  nombreDoctor: string = '';
  firmaPaciente: boolean = false;
  firmaDoctor: boolean = false;
  contextoFirmaPaciente: CanvasRenderingContext2D | null = null;
  contextoFirmaDoctor: CanvasRenderingContext2D | null = null;
  firmando: boolean = false;
  ultimaPosicionX: number = 0;
  ultimaPosicionY: number = 0;
  canvasFirmaActual: ElementRef<HTMLCanvasElement> | null = null;
  contextoActual: CanvasRenderingContext2D | null = null;
  guardando: boolean = false;
  tipoConsentimientoSeleccionado: string = '';
  fechaActual: Date = new Date();
  pdfGenerado: string | null = null;
  consentimientoForm: FormGroup;
  pacienteId: string = '';
  consultaId: string = '';
  cargando: boolean = false;
  error: string | null = null;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consultaService: ConsultaService,
    private pacienteService: PacienteService
  ) {
    this.consentimientoForm = this.fb.group({
      consentimiento_check: [false, Validators.requiredTrue],
    });
  }
  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.pacienteId = params['numero_documento'];
      this.consultaId = params['consulta_id'];

      if (this.pacienteId) {
        this.cargarPaciente();
        this.cargarDoctor();
      } else {
        this.error = 'No se pudo identificar al paciente';
      }
    });

    // Inicializar tipo de consentimiento
    this.tipoConsentimientoSeleccionado = 'general';
  }
  cargarPaciente(): void {
    this.cargando = true;

    this.pacienteService.obtenerPacienteId(this.pacienteId).subscribe({
      next: (response) => {
        this.paciente = response.data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del paciente:', error);
        this.error = 'No se pudo cargar la información del paciente';
        this.cargando = false;
      },
    });
  }

  // Método para obtener el nombre del doctor
  cargarDoctor(): void {
    const nombreUsuario = localStorage.getItem('nombreCompleto');
    this.nombreDoctor = nombreUsuario || 'Sistema';
  }
  private tipoConsentimientoChangeSub?: Subscription;
  @ViewChild('firmaPacienteCanvas')
  firmaPacienteCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('firmaDoctorCanvas')
  firmaDoctorCanvas!: ElementRef<HTMLCanvasElement>;
  inicializarCanvasFirmas(): void {
    // Verificar que las referencias existan antes de usarlas
    if (!this.firmaPacienteCanvas || !this.firmaDoctorCanvas) {
      console.warn('Las referencias a los canvas no están disponibles todavía');
      return;
    }

    // Inicializar canvas de firma paciente
    const canvasPaciente = this.firmaPacienteCanvas.nativeElement;
    this.contextoFirmaPaciente = canvasPaciente.getContext('2d');

    // Inicializar canvas de firma doctor
    const canvasDoctor = this.firmaDoctorCanvas.nativeElement;
    this.contextoFirmaDoctor = canvasDoctor.getContext('2d');

    if (this.contextoFirmaPaciente) {
      this.contextoFirmaPaciente.lineWidth = 2;
      this.contextoFirmaPaciente.lineCap = 'round';
      this.contextoFirmaPaciente.strokeStyle = 'black';

      // Eventos para canvas paciente
      this.configurarEventosFirma(
        canvasPaciente,
        this.contextoFirmaPaciente,
        'paciente'
      );
    }

    if (this.contextoFirmaDoctor) {
      this.contextoFirmaDoctor.lineWidth = 2;
      this.contextoFirmaDoctor.lineCap = 'round';
      this.contextoFirmaDoctor.strokeStyle = 'black';

      // Eventos para canvas doctor
      this.configurarEventosFirma(
        canvasDoctor,
        this.contextoFirmaDoctor,
        'doctor'
      );
    }
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.inicializarCanvasFirmas();
    }, 100);
  }
  ngOnDestroy(): void {
    if (this.tipoConsentimientoChangeSub) {
      this.tipoConsentimientoChangeSub.unsubscribe();
    }
  }
  configurarEventosFirma(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    tipo: 'paciente' | 'doctor'
  ): void {
    canvas.addEventListener('mousedown', (event) => {
      this.firmando = true;
      this.canvasFirmaActual =
        tipo === 'paciente' ? this.firmaPacienteCanvas : this.firmaDoctorCanvas;
      this.contextoActual = context;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      this.ultimaPosicionX = (event.clientX - rect.left) * scaleX;
      this.ultimaPosicionY = (event.clientY - rect.top) * scaleY;
    });

    canvas.addEventListener('mousemove', (event) => {
      if (!this.firmando || !this.contextoActual) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const posX = (event.clientX - rect.left) * scaleX;
      const posY = (event.clientY - rect.top) * scaleY;

      this.dibujarLinea(
        this.contextoActual,
        this.ultimaPosicionX,
        this.ultimaPosicionY,
        posX,
        posY
      );

      this.ultimaPosicionX = posX;
      this.ultimaPosicionY = posY;

      // Marcar que hay firma
      if (tipo === 'paciente') {
        this.firmaPaciente = true;
      } else {
        this.firmaDoctor = true;
      }
    });

    // Para que funcione aunque se suelte el mouse fuera del canvas
    window.addEventListener('mouseup', () => {
      this.firmando = false;
    });

    // Soporte para dispositivos táctiles
    canvas.addEventListener(
      'touchstart',
      (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
      },
      { passive: false }
    );

    canvas.addEventListener(
      'touchmove',
      (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
      },
      { passive: false }
    );

    canvas.addEventListener('touchend', () => {
      const mouseEvent = new MouseEvent('mouseup');
      window.dispatchEvent(mouseEvent);
    });
  }

  dibujarLinea(
    context: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  limpiarFirma(tipo: 'paciente' | 'doctor'): void {
    const canvas =
      tipo === 'paciente'
        ? this.firmaPacienteCanvas.nativeElement
        : this.firmaDoctorCanvas.nativeElement;

    const context =
      tipo === 'paciente'
        ? this.contextoFirmaPaciente
        : this.contextoFirmaDoctor;

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (tipo === 'paciente') {
        this.firmaPaciente = false;
      } else {
        this.firmaDoctor = false;
      }
    }
  }
  guardarConsentimiento(): void {
    if (!this.consentimientoForm.valid) {
      alert('Debes aceptar el consentimiento informado');
      return;
    }

    // Verificar si hay firmas
    if (!this.firmaPaciente || !this.firmaDoctor) {
      alert('Se requieren ambas firmas para guardar el consentimiento');
      return;
    }

    // Verificar si hay PDF generado, si no, generarlo
    if (!this.pdfGenerado) {
      this.generarPDFSilencioso()
        .then(() => {
          this.enviarConsentimiento();
        })
        .catch((error) => {
          console.error('Error generando PDF:', error);
          alert('Error al generar el documento. Intente de nuevo.');
        });
    } else {
      this.enviarConsentimiento();
    }
  }
  async generarPDFSilencioso(): Promise<void> {
    this.guardando = true;

    const elemento = document.getElementById('documento-consentimiento');
    if (!elemento) {
      throw new Error('No se pudo encontrar el elemento del documento');
    }

    // Ocultar elementos que no deben aparecer en el PDF
    const botonesLimpiar = document.querySelectorAll('.btn-firma');
    botonesLimpiar.forEach((boton) => {
      (boton as HTMLElement).style.display = 'none';
    });

    const instrucciones = document.querySelector('.firma-instructions');
    let instruccionesDisplay = '';
    if (instrucciones) {
      instruccionesDisplay = (instrucciones as HTMLElement).style.display;
      (instrucciones as HTMLElement).style.display = 'none';
    }

    try {
      const canvas = await html2canvas(elemento, {
        scale: 0.8,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      pdf.addImage(
        imgData,
        'JPEG',
        imgX,
        0,
        imgWidth * ratio,
        imgHeight * ratio
      );
      this.pdfGenerado = pdf.output('datauristring');

      // Restaurar elementos
      botonesLimpiar.forEach((boton) => {
        (boton as HTMLElement).style.display = '';
      });

      if (instrucciones) {
        (instrucciones as HTMLElement).style.display = instruccionesDisplay;
      }

      return Promise.resolve();
    } catch (error) {
      // Restaurar elementos
      botonesLimpiar.forEach((boton) => {
        (boton as HTMLElement).style.display = '';
      });

      if (instrucciones) {
        (instrucciones as HTMLElement).style.display = instruccionesDisplay;
      }

      return Promise.reject(error);
    }
  }
  enviarConsentimiento(): void {
    if (this.guardando && !this.pdfGenerado) {
      alert('Error: No se ha generado el PDF todavía');
      this.guardando = false;
      return;
    }

    // Convertir el PDF base64 a un archivo Blob
    if (this.pdfGenerado) {
      // Extraer la parte de datos del data URI
      const base64Data = this.pdfGenerado.split(',')[1];
      // Convertir base64 a array de bytes
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      // Crear blob
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

      // Enviar al servidor
      this.consultaService
        .guardarConsentimiento(this.consultaId, pdfBlob)
        .subscribe({
          next: (response) => {
            this.guardando = false;
            alert('Consentimiento guardado correctamente');
            // Navegar de regreso a la historia clínica
            this.router.navigate([
              '/info-paciente',
              this.pacienteId
            ]);
          },
          error: (err) => {
            this.guardando = false;
            console.error('Error al guardar el consentimiento:', err);
            alert(
              'Error al guardar el consentimiento: ' +
                (err.error?.message || err.message || 'Error desconocido')
            );
          },
        });
    } else {
      this.guardando = false;
      alert('Error: No se pudo generar el documento PDF');
    }
  }
  seleccionarTipoConsentimiento(event: any): void {
    const tipo = event.target.value;
    this.tipoConsentimientoSeleccionado = tipo;

    // Esperar a que Angular actualice el DOM con los nuevos elementos
    setTimeout(() => {
      this.inicializarCanvasFirmas();
    }, 100);
  }
  obtenerTituloConsentimiento(): string {
    switch (this.tipoConsentimientoSeleccionado) {
      case 'general':
        return 'GENERAL';
      case 'procedimiento':
        return 'PROCEDIMIENTO ESPECÍFICO';
      case 'terapia':
        return 'TERAPIA AVANZADA';
      default:
        return '';
    }
  }
  generarPDF(): void {
    // Verificar si hay firmas
    if (!this.firmaPaciente || !this.firmaDoctor) {
      alert('Se requieren ambas firmas antes de generar el PDF');
      return;
    }

    // Verificar si el checkbox está marcado
    if (!this.consentimientoForm.valid) {
      alert('Debe aceptar los términos del consentimiento');
      return;
    }

    const elemento = document.getElementById('documento-consentimiento');
    if (!elemento) {
      alert('Error al generar el PDF');
      return;
    }

    // Mostrar spinner o indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'pdf-loading';
    loadingIndicator.textContent = 'Generando PDF...';
    document.body.appendChild(loadingIndicator);

    // Asegurarse que las firmas sean visibles y la línea de firma esté oculta
    const firmasPacienteContainer = document.querySelector(
      '.firma-paciente .firma-canvas-container'
    );
    const firmasDoctorContainer = document.querySelector(
      '.firma-doctor .firma-canvas-container'
    );

    if (firmasPacienteContainer) {
      firmasPacienteContainer.classList.add('has-firma');
    }

    if (firmasDoctorContainer) {
      firmasDoctorContainer.classList.add('has-firma');
    }

    // Ocultar temporalmente los controles de borrado para el PDF
    const botonesLimpiar = document.querySelectorAll('.btn-firma');
    botonesLimpiar.forEach((boton) => {
      (boton as HTMLElement).style.display = 'none';
    });

    // Ocultar instrucciones de firma para el PDF
    const instrucciones = document.querySelector('.firma-instructions');
    let instruccionesDisplay = '';
    if (instrucciones) {
      instruccionesDisplay = (instrucciones as HTMLElement).style.display;
      (instrucciones as HTMLElement).style.display = 'none';
    }

    // Convertir el HTML a canvas y luego a PDF
    html2canvas(elemento, {
      scale: 0.8,
      logging: false,
      useCORS: true,
      allowTaint: true,
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png', 0.5);
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;

        pdf.addImage(
          imgData,
          'PNG',
          imgX,
          0,
          imgWidth * ratio,
          imgHeight * ratio
        );

        // Guardar el PDF como base64 para enviarlo al backend
        this.pdfGenerado = pdf.output('datauristring');

        // Restaurar visibilidad de los botones de limpiar
        botonesLimpiar.forEach((boton) => {
          (boton as HTMLElement).style.display = '';
        });

        // Restaurar instrucciones
        if (instrucciones) {
          (instrucciones as HTMLElement).style.display = instruccionesDisplay;
        }

        // Mostrar vista previa del PDF en nueva pestaña
        window.open(URL.createObjectURL(pdf.output('blob')));

        // Eliminar indicador de carga
        document.body.removeChild(loadingIndicator);

        // NUEVO: Guardar automáticamente el consentimiento
        this.guardando = true;
        setTimeout(() => {
          // Mostrar mensaje de guardado
          loadingIndicator.textContent = 'Guardando consentimiento...';
          document.body.appendChild(loadingIndicator);

          // Llamar al método de envío
          this.enviarConsentimiento();
        }, 500);
      })
      .catch((error) => {
        console.error('Error al generar el PDF:', error);
        document.body.removeChild(loadingIndicator);
        alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');

        // Restaurar visibilidad de los botones de limpiar
        botonesLimpiar.forEach((boton) => {
          (boton as HTMLElement).style.display = '';
        });

        // Restaurar instrucciones
        if (instrucciones) {
          (instrucciones as HTMLElement).style.display = instruccionesDisplay;
        }
      });
  }
}
