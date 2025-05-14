import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PacienteService } from '../../../services/paciente.service';
import { PacienteNavComponent } from '../paciente-nav/paciente-nav.component';
import { CarpetaComponent } from '../carpeta/carpeta.component';
import { DashboardCitasComponent } from '../citas/dashboard-citas/dashboard-citas.component';
import { RecetaComponent } from '../receta/receta.component';
import { HistoriaClinicaComponent } from '../historia-clinica/historia-clinica.component';
import { RedfamiliarService } from '../../../services/redfamiliar.service';

@Component({
  selector: 'app-info-paciente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PacienteNavComponent,
    CarpetaComponent,
    DashboardCitasComponent,
    RecetaComponent,
    HistoriaClinicaComponent,
    RouterModule 
  ],
  templateUrl: './info-paciente.component.html',
  styleUrl: './info-paciente.component.css',
})
export class InfoPacienteComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  pacienteId: string = '';
  paciente: any = null;
  pacientePhotoUrl: SafeUrl | null = null;
  editMode: boolean = false;
  nombreDoctor: string = ''; // Por defecto
  loading: boolean = false;
  error: string = '';
  activeTab: string = 'info';
  pacienteForm: FormGroup;
  cargandoFoto: boolean = false;
  cargandoDoctor: boolean = false;
  esMenorDeEdad: boolean = false;
  tieneMiembrosRedFamiliar: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pacienteService: PacienteService,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private redFamiliarService: RedfamiliarService 
  ) {
    this.pacienteForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      edad: [{ value: '', disabled: true }],
      ciudad_nacimiento: [''],
      sexo: [''],
      tipo_documento: ['', Validators.required],
      numero_documento: ['', Validators.required],
      ciudad_expedicion: [''],
      ciudad_domicilio: [''],
      barrio: [''],
      direccion_domicilio: [''],
      telefono: [''],
      email: ['', Validators.email],
      celular: ['', Validators.required],
      alergias: [''],
      antecedentes: [''],
      antecedentes_familiares: [''],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.pacienteId = params['numero_documento'];
      this.cargarPaciente();
      this.cargarDoctorPaciente();
    });
  }

  cargarPaciente(): void {
    this.loading = true;

    this.pacienteService.obtenerPacienteId(this.pacienteId).subscribe({
      next: (response) => {
        this.paciente = response.data;
        this.actualizarFormulario();
        this.cargarFotoPaciente();
        this.calcularEdadYEstado();
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

    this.pacienteService.obtenerFotoPaciente(this.pacienteId).subscribe({
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
  actualizarFormulario(): void {
    if (this.paciente) {
      console.log('Datos del paciente a cargar:', this.paciente);

      // Formatear la fecha de nacimiento para que se muestre correctamente
      let fechaNacimiento = '';
      if (this.paciente.fecha_nacimiento) {
        // Convertir a objeto Date
        const fecha = new Date(this.paciente.fecha_nacimiento);
        // Formatear como YYYY-MM-DD para que funcione con input type="date"
        fechaNacimiento = fecha.toISOString().split('T')[0];
      }

      // Actualizar todos los campos del formulario
      this.pacienteForm.patchValue({
        nombre: this.paciente.nombre || '',
        apellidos: this.paciente.apellidos || '',
        fecha_nacimiento: fechaNacimiento,
        sexo: this.paciente.sexo || 'Masculino',
        ciudad_nacimiento: this.paciente.ciudad_nacimiento || '',
        tipo_documento: this.paciente.tipo_documento || '',
        numero_documento: this.paciente.numero_documento || '',
        ciudad_expedicion: this.paciente.ciudad_expedicion || '',
        ciudad_domicilio: this.paciente.ciudad_domicilio || '',
        barrio: this.paciente.barrio || '',
        direccion_domicilio: this.paciente.direccion_domicilio || '',
        telefono: this.paciente.telefono || '',
        email: this.paciente.email || '',
        celular: this.paciente.celular || '',
        ocupacion: this.paciente.ocupacion || '',
        estado_civil: this.paciente.estado_civil || 'Soltero',
        eps: this.paciente.eps || '',
        tipo_afiliacion: this.paciente.tipo_afiliacion || 'Contributivo',
        grupo_sanguineo: this.paciente.grupo_sanguineo || 'O',
        rh: this.paciente.rh || '+',
        alergias: this.paciente.alergias || '',
        antecedentes: this.paciente.antecedentes || '',
        antecedentes_familiares: this.paciente.antecedentes_familiares || '',
      });

      // Calcular edad a partir de la fecha de nacimiento
      if (fechaNacimiento) {
        const edad = this.calcularEdad(fechaNacimiento);
        this.pacienteForm.get('edad')?.setValue(edad);
      }
    }
  }
  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    return edad;
  }

  getInitials(): string {
    if (this.paciente && this.paciente.nombre && this.paciente.apellidos) {
      return (
        this.paciente.nombre.charAt(0) + this.paciente.apellidos.charAt(0)
      ).toUpperCase();
    }
    return 'P';
  }

  enableEditMode(): void {
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
    this.actualizarFormulario(); // Restaurar datos originales
  }

  guardarCambios(): void {
    if (this.pacienteForm.invalid) {
      Object.keys(this.pacienteForm.controls).forEach((key) => {
        const control = this.pacienteForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;
    const pacienteData = { ...this.pacienteForm.value };

    this.pacienteService
      .actualizarDatosPaciente(this.pacienteId, pacienteData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.editMode = false;
          this.cargarPaciente(); // Recargar datos actualizados
        },
        error: (error) => {
          console.error('Error al guardar cambios:', error);
          this.loading = false;
          // Mostrar mensaje de error
        },
      });
  }
  onTabChange(tabId: string): void {
    this.activeTab = tabId;
  }
  cargarDoctorPaciente(): void {
    const nombreUsuario = localStorage.getItem('nombreCompleto');
  
    if (nombreUsuario) {
      this.nombreDoctor = nombreUsuario;
      console.log('Nombre del doctor cargado desde localStorage:', this.nombreDoctor);
    } else {
      this.nombreDoctor = 'Sistema';
      console.log('No se encontró nombre de doctor en localStorage, usando valor por defecto');
    }
  }
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
  calcularEdadYEstado(): void {
    if (this.paciente?.fecha_nacimiento) {
      const fechaNacimiento = new Date(this.paciente.fecha_nacimiento);
      const hoy = new Date();
      
      let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const m = hoy.getMonth() - fechaNacimiento.getMonth();
      
      if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
      }
      
      // Determinar si es menor de edad
      this.esMenorDeEdad = edad < 18;
      
      // Si es menor, verificamos si tiene miembros en la red familiar
      if (this.esMenorDeEdad && this.pacienteId) {
        this.verificarMiembrosRedFamiliar();
      }
    }
  }
  verificarMiembrosRedFamiliar(): void {
    this.redFamiliarService.verificarSiTieneMiembros(this.pacienteId).subscribe({
      next: (tieneMiembros) => {
        this.tieneMiembrosRedFamiliar = tieneMiembros;
        console.log(`Paciente ${this.pacienteId} tiene miembros en red familiar: ${tieneMiembros}`);
      },
      error: (error) => {
        console.error('Error al verificar red familiar:', error);
        this.tieneMiembrosRedFamiliar = false; // Por precaución, asumimos que no tiene
      }
    });
  }
  // Método para manejar la selección del archivo
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tamaño máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. El tamaño máximo permitido es 5MB.');
        input.value = ''; // Limpiar el input
        return;
      }
      
      // Validar tipo de archivo
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        alert('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP).');
        input.value = ''; // Limpiar el input
        return;
      }
      
      this.cargandoFoto = true;
      
      this.pacienteService.actualizarFotoPaciente(this.pacienteId, file).subscribe({
        next: (response) => {
          console.log('Foto actualizada correctamente:', response);
          this.cargarFotoPaciente(); // Recargar la foto
          input.value = ''; // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
        },
        error: (error) => {
          console.error("Error al subir la foto:", error);
          this.cargandoFoto = false;
          alert('Error al subir la foto. Por favor intente nuevamente.');
          input.value = ''; // Limpiar el input
        }
      });
    }
  }
}
