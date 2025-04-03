import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { PacienteService } from '../../../services/paciente.service';

@Component({
  selector: 'app-info-paciente',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './info-paciente.component.html',
  styleUrl: './info-paciente.component.css'
})
export class InfoPacienteComponent  implements OnInit {
  pacienteId: string = '';
  paciente: any = null;
  pacientePhotoUrl: SafeUrl | null = null;
  editMode: boolean = false;
  nombreDoctor: string = 'Casa Olimpo'; // Por defecto
  loading: boolean = false;
  error: string = '';
  
  pacienteForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pacienteService: PacienteService,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.pacienteForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      edad: [{value: '', disabled: true}],
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
      antecedentes_familiares: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.pacienteId = params['numero_documento'];
      this.cargarPaciente();
    });
  }

  cargarPaciente(): void {
    this.loading = true;
    
    this.pacienteService.obtenerPacienteId(this.pacienteId).subscribe({
      next: (response) => {
        this.paciente = response.data;
        this.actualizarFormulario();
        this.cargarFotoPaciente();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del paciente:', error);
        this.error = 'No se pudo cargar la información del paciente';
        this.loading = false;
      }
    });
  }

  cargarFotoPaciente(): void {
    if (this.paciente && this.paciente.foto) {
      this.pacienteService.obtenerFotoPaciente(this.pacienteId).subscribe({
        next: (blob) => {
          const objectURL = URL.createObjectURL(blob);
          this.pacientePhotoUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
        },
        error: (error) => {
          console.error('Error al cargar la foto del paciente:', error);
        }
      });
    }
  }

  actualizarFormulario(): void {
    if (this.paciente) {
      this.pacienteForm.patchValue({
        nombre: this.paciente.nombre || '',
        apellidos: this.paciente.apellidos || '',
        fecha_nacimiento: this.paciente.fecha_nacimiento || '',
        ciudad_nacimiento: this.paciente.ciudad_nacimiento || '',
        sexo: this.paciente.sexo || '',
        tipo_documento: this.paciente.tipo_documento || '',
        numero_documento: this.paciente.numero_documento || '',
        ciudad_expedicion: this.paciente.ciudad_expedicion || '',
        ciudad_domicilio: this.paciente.ciudad_domicilio || '',
        barrio: this.paciente.barrio || '',
        direccion_domicilio: this.paciente.direccion_domicilio || '',
        telefono: this.paciente.telefono || '',
        email: this.paciente.email || '',
        celular: this.paciente.celular || '',
        alergias: this.paciente.alergias || '',
        antecedentes: this.paciente.antecedentes || '',
        antecedentes_familiares: this.paciente.antecedentes_familiares || ''
      });
      
      // Calcular edad a partir de la fecha de nacimiento
      if (this.paciente.fecha_nacimiento) {
        const edad = this.calcularEdad(this.paciente.fecha_nacimiento);
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
      return (this.paciente.nombre.charAt(0) + this.paciente.apellidos.charAt(0)).toUpperCase();
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
      Object.keys(this.pacienteForm.controls).forEach(key => {
        const control = this.pacienteForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }
    
    this.loading = true;
    const pacienteData = {...this.pacienteForm.value};
    
    this.pacienteService.actualizarDatosPaciente(this.pacienteId, pacienteData).subscribe({
      next: (response) => {
        this.loading = false;
        this.editMode = false;
        this.cargarPaciente(); // Recargar datos actualizados
      },
      error: (error) => {
        console.error('Error al guardar cambios:', error);
        this.loading = false;
        // Mostrar mensaje de error
      }
    });
  }
}
