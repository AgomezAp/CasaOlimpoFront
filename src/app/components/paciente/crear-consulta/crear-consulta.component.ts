import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Consulta } from '../../../interfaces/consulta';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../services/consulta.service';
import { PacienteService } from '../../../services/paciente.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Subscription } from 'rxjs';
import { NotificacionService } from '../../../services/notificacion.service';
@Component({
  selector: 'app-crear-consulta',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-consulta.component.html',
  styleUrl: './crear-consulta.component.css',
})
export class CrearConsultaComponent implements OnInit {
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
  guardando: boolean = false;

  pdfGenerado: string | null = null;
  paginatedConsultas: Consulta[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consultaService: ConsultaService,
    private pacienteService: PacienteService,
    private sanitizer: DomSanitizer,
    private notificacionService: NotificacionService
  ) {
    this.consultaForm = this.fb.group({
      motivo: ['', Validators.required],
      enfermedad_actual: ['', Validators.required],
      objetivos_terapia: ['', Validators.required],
      historia_problema: ['', Validators.required],
      tipo_diagnostico: ['', Validators.required],
      plan_tratamiento: ['', Validators.required],
      contraindicaciones: ['', Validators.required], 
      recomendaciones: [''],
    });
  }
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.numeroDocumento = params['numero_documento'];
      if (this.numeroDocumento) {
        this.pacienteId = this.numeroDocumento; // Sincronizar IDs
        this.cargarPaciente();
        this.cargarDoctor();
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
      console.log(
        'Nombre del doctor cargado desde localStorage:',
        this.nombreDoctor
      );
    } else {
      this.nombreDoctor = 'Sistema';
      console.log(
        'No se encontró nombre de doctor en localStorage, usando valor por defecto'
      );
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
    // 1. Primero verificar si el formulario es válido
    if (this.consultaForm.invalid) {
      Object.keys(this.consultaForm.controls).forEach(key => {
        const control = this.consultaForm.get(key);
        control?.markAsTouched();
      });
      
      this.notificacionService.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    // 2. Activar indicador de carga
    this.guardando = true;
    
    // 3. Obtener el ID del doctor desde localStorage
    const userId = localStorage.getItem('userId'); // O como lo tengas almacenado
    
    if (!userId) {
      this.guardando = false;
      this.notificacionService.error('Error: No se pudo identificar al doctor. Por favor inicie sesión nuevamente.');
      return;
    }
    
    // 4. Preparar los datos de la consulta incluyendo el ID del doctor
    const datosConsulta = {
      ...this.consultaForm.value,
      numero_documento: this.numeroDocumento,
      Uid: userId  // Añadiendo el ID del usuario (doctor)
    };
    
    // 5. Llamar al servicio para guardar la consulta
    this.consultaService.crearConsulta(this.numeroDocumento, datosConsulta).subscribe({
      next: (respuesta) => {
        this.guardando = false;
        this.notificacionService.success('Consulta guardada correctamente');
        this.router.navigate(['/info-paciente', this.numeroDocumento]);
      },
      error: (error) => {
        this.guardando = false;
        console.error('Error al guardar la consulta:', error);
        
        const mensaje = error.error?.message || 'Error al guardar la consulta. Intente nuevamente.';
        this.notificacionService.error(mensaje);
      }
    });
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

    this.consultaService
      .crearConsultaConArchivo(this.numeroDocumento, formData)
      .subscribe({
        next: (response) => {
          this.notificacionService.success('Consulta creada correctamente');
          this.router.navigate(['/info-paciente', this.numeroDocumento]);
        },
        error: (err) => {
          // Desactivar el indicador de carga en caso de error
          console.error('Error al crear consulta:', err);
          alert(
            'Error al crear la consulta: ' +
              (err.message || 'Error desconocido')
          );
        },
      });
  }
  cancelar(): void {
    this.router.navigate(['/info-paciente', this.numeroDocumento]);
  }
}
