import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Consulta } from '../../../interfaces/consulta';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../services/consulta.service';
import { PacienteService } from '../../../services/paciente.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-crear-consulta',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './crear-consulta.component.html',
  styleUrl: './crear-consulta.component.css'
})
export class CrearConsultaComponent implements OnInit,AfterViewInit {
  pacienteId: string = '';
  paciente: any = null;
  consultaForm: FormGroup;
  pacientePhotoUrl: SafeUrl | null = null;
  numeroDocumento: string = '';
  cargandoPaciente: boolean = false;
  cargandoDoctor: boolean = false;
  nombreDoctor: string = '';
  archivoConsentimiento: File | null = null;
  loading: boolean = false;
  cargandoFoto: boolean = false;
  error: string = '';
  tipoConsentimientoSeleccionado: string = '';
  fechaActual: Date = new Date();
  pdfGenerado: string | null = null;
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
  private tipoConsentimientoChangeSub?: Subscription;
  @ViewChild('firmaPacienteCanvas') firmaPacienteCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('firmaDoctorCanvas') firmaDoctorCanvas!: ElementRef<HTMLCanvasElement>;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consultaService: ConsultaService,
    private pacienteService: PacienteService,
    private sanitizer: DomSanitizer
  ) {
    this.consultaForm = this.fb.group({
      motivo: ['', Validators.required],
      enfermedad_actual: ['', Validators.required],
      objetivos_terapia: ['', Validators.required],
      historia_problema: ['', Validators.required],
      desarrollo: ['', Validators.required],
      plan_terapeutico: ['', Validators.required],
      tipo_diagnostico: ['', Validators.required],
      analisis_diagnostico: ['', Validators.required],
      plan_tratamiento: ['', Validators.required],
      recomendaciones: [''],
      consentimiento_check: [false, Validators.requiredTrue]
    });
  }
  ngAfterViewInit(): void {
    // No inicializar canvas aquí directamente
    
    // Establecer un observador para cuando cambie el tipo de consentimiento
    this.tipoConsentimientoChangeSub = this.consultaForm.get('tipo_consentimiento')?.valueChanges.subscribe(
      (value) => {
        if (value) {
          // Esperar a que Angular actualice el DOM
          setTimeout(() => {
            this.inicializarCanvasFirmas();
          }, 100);
        }
      }
    );
    
    // También intentar inicializar si ya hay un tipo seleccionado
    if (this.tipoConsentimientoSeleccionado) {
      setTimeout(() => {
        this.inicializarCanvasFirmas();
      }, 100);
    }
  }
  
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.numeroDocumento = params['numero_documento'];
      if (this.numeroDocumento) {
        this.pacienteId = this.numeroDocumento; // Sincronizar IDs
        this.cargarPaciente();
        this.cargarDoctor();
      }
    });
  }
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
      this.configurarEventosFirma(canvasPaciente, this.contextoFirmaPaciente, 'paciente');
    }
    
    if (this.contextoFirmaDoctor) {
      this.contextoFirmaDoctor.lineWidth = 2;
      this.contextoFirmaDoctor.lineCap = 'round';
      this.contextoFirmaDoctor.strokeStyle = 'black';
      
      // Eventos para canvas doctor
      this.configurarEventosFirma(canvasDoctor, this.contextoFirmaDoctor, 'doctor');
    }
  }
  ngOnDestroy(): void {
    if (this.tipoConsentimientoChangeSub) {
      this.tipoConsentimientoChangeSub.unsubscribe();
    }
  }
  
  configurarEventosFirma(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, tipo: 'paciente' | 'doctor'): void {
    canvas.addEventListener('mousedown', (event) => {
      this.firmando = true;
      this.canvasFirmaActual = tipo === 'paciente' ? this.firmaPacienteCanvas : this.firmaDoctorCanvas;
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
    canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }, { passive: false });

    canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }, { passive: false });

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
    const canvas = tipo === 'paciente' ? 
      this.firmaPacienteCanvas.nativeElement : 
      this.firmaDoctorCanvas.nativeElement;
      
    const context = tipo === 'paciente' ? 
      this.contextoFirmaPaciente : 
      this.contextoFirmaDoctor;
      
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      if (tipo === 'paciente') {
        this.firmaPaciente = false;
      } else {
        this.firmaDoctor = false;
      }
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
      case 'general': return 'GENERAL';
      case 'procedimiento': return 'PROCEDIMIENTO ESPECÍFICO';
      case 'terapia': return 'TERAPIA AVANZADA';
      default: return '';
    }
  }
  generarPDF(): void {
    // Verificar si hay firmas
    if (!this.firmaPaciente || !this.firmaDoctor) {
      alert('Se requieren ambas firmas antes de generar el PDF');
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
    const firmasPacienteContainer = document.querySelector('.firma-paciente .firma-canvas-container');
    const firmasDoctorContainer = document.querySelector('.firma-doctor .firma-canvas-container');
    
    if (firmasPacienteContainer) {
      firmasPacienteContainer.classList.add('has-firma');
    }
    
    if (firmasDoctorContainer) {
      firmasDoctorContainer.classList.add('has-firma');
    }
    
    // Ocultar temporalmente los controles de borrado para el PDF
    const botonesLimpiar = document.querySelectorAll('.btn-firma');
    botonesLimpiar.forEach(boton => {
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
      scale: 1.2,
      logging: false,
      useCORS: true,
      allowTaint: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      
      // Guardar el PDF como base64 para enviarlo al backend
      this.pdfGenerado = pdf.output('datauristring');
      
      // Restaurar visibilidad de los botones de limpiar
      botonesLimpiar.forEach(boton => {
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
      
      // Marcar el checkbox de consentimiento si no está marcado ya
      if (!this.consultaForm.get('consentimiento_check')?.value) {
        this.consultaForm.get('consentimiento_check')?.setValue(true);
        this.consultaForm.get('consentimiento_check')?.updateValueAndValidity();
      }
    }).catch(error => {
      console.error('Error al generar el PDF:', error);
      document.body.removeChild(loadingIndicator);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
      
      // Restaurar visibilidad de los botones de limpiar
      botonesLimpiar.forEach(boton => {
        (boton as HTMLElement).style.display = '';
      });
      
      // Restaurar instrucciones
      if (instrucciones) {
        (instrucciones as HTMLElement).style.display = instruccionesDisplay;
      }
    });
  }
  cargarPaciente(): void {
    this.loading = true;

    this.pacienteService.obtenerPacienteId(this.numeroDocumento).subscribe({
      next: (response) => {
        this.paciente = response.data;
        this.cargarFotoPaciente();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del paciente:', error);
        this.error = 'No se pudo cargar la información del paciente';
        this.loading = false;
      },
    });
  }
  cargarFotoPaciente(): void {
    this.cargandoFoto = true;

    this.pacienteService.obtenerFotoPaciente(this.numeroDocumento).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          console.log(
            'Foto de paciente cargada correctamente, tamaño:',
            blob.size
          );
          // Crear URL a partir del blob recibido
          const objectURL = URL.createObjectURL(blob);
          this.pacientePhotoUrl =
            this.sanitizer.bypassSecurityTrustUrl(objectURL);
        } else {
          console.log('La foto del paciente está vacía o no existe');
          this.pacientePhotoUrl = null;
        }
        this.cargandoFoto = false;
      },
      error: (error) => {
        console.error('Error al cargar la foto del paciente:', error);
        this.pacientePhotoUrl = null;
        this.cargandoFoto = false;
      },
    });
  }

  cargarDoctor(): void {
    const nombreUsuario = localStorage.getItem('nombreCompleto');
  
    if (nombreUsuario) {
      this.nombreDoctor = nombreUsuario;
      console.log('Nombre del doctor cargado desde localStorage:', this.nombreDoctor);
    } else {
      this.nombreDoctor = 'Sistema';
      console.log('No se encontró nombre de doctor en localStorage, usando valor por defecto');
    }
  }

  getInitials(): string {
    if (!this.paciente) return '?';
    return (
      (this.paciente.nombre ? this.paciente.nombre.charAt(0) : '') +
      (this.paciente.apellidos ? this.paciente.apellidos.charAt(0) : '')
    ).toUpperCase();
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.archivoConsentimiento = event.target.files[0];
    }
  }

  guardarConsulta(): void {
    const userEmail = localStorage.getItem('correo');
  
    if (!userEmail) {
      alert('No se pudo obtener el correo del usuario. Por favor inicie sesión nuevamente.');
      return;
    }
    if (this.consultaForm.invalid) {
      Object.keys(this.consultaForm.controls).forEach(key => {
        this.consultaForm.get(key)?.markAsTouched();
      });
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Activar indicador de guardando
    this.guardando = true;
    
    // Crear objeto consulta
    const consulta: Partial<Consulta> = {
      ...this.consultaForm.value,
      numero_documento: this.numeroDocumento,
      fecha: new Date(),
      correo: userEmail,
      Uid: Number(localStorage.getItem('userId')) || 0,
      abierto: true,
      consentimiento_info: this.pdfGenerado
    };
  
    this.enviarConsulta(consulta);
  }
  enviarConsulta(consulta: Partial<Consulta>): void {
    // Convertir el PDF base64 a un archivo Blob/File
    let pdfBlob: Blob | null = null;
    
    if (this.pdfGenerado) {
      // Extraer la parte de datos del data URI (eliminar "data:application/pdf;base64,")
      const base64Data = this.pdfGenerado.split(',')[1];
      // Convertir base64 a array de bytes
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      // Crear blob
      pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
    }
    
    // Crear FormData para enviar datos mixtos (json + archivo)
    const formData = new FormData();
    
    // Agregar todos los campos de texto
    Object.keys(consulta).forEach(key => {
      // No incluir consentimiento_info en los campos normales
      if (key !== 'consentimiento_info') {
        // Use type assertion to tell TypeScript this is a valid key
        formData.append(key, consulta[key as keyof Partial<Consulta>] as string);
      }
    });
    
    // Agregar el archivo PDF si existe
    if (pdfBlob) {
      formData.append('consentimiento_info', pdfBlob, `consentimiento_${this.numeroDocumento}.pdf`);
    }
    
    // Estado de guardando ya activado desde el método guardarConsulta
    
    // Enviar usando el servicio, pero con FormData en lugar de JSON
    this.consultaService.crearConsultaConArchivo(this.numeroDocumento, formData)
      .subscribe({
        next: (response) => {
          // Desactivar el indicador de carga
          this.guardando = false;
          alert('Consulta creada correctamente');
          this.router.navigate(['/info-paciente', this.numeroDocumento]);
        },
        error: (err) => {
          // Desactivar el indicador de carga en caso de error
          this.guardando = false;
          console.error('Error al crear consulta:', err);
          alert('Error al crear la consulta: ' + (err.message || 'Error desconocido'));
        }
      });
  }
  cancelar(): void {
    this.router.navigate(['/info-paciente', this.numeroDocumento]);
  }


}
