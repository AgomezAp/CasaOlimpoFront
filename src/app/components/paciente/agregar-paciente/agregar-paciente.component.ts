import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PacienteService } from '../../../services/paciente.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-agregar-paciente',
  imports: [ CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './agregar-paciente.component.html',
  styleUrl: './agregar-paciente.component.css'
})
export class AgregarPacienteComponent implements OnInit {
  pacienteForm: FormGroup;
  submitted = false;
  photoPreview: string | null = null;
  photoFile: File | null = null;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private pacienteService: PacienteService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.pacienteForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      sexo: [''],
      ciudad_nacimiento: [''],
      edad: [{value: '', disabled: true}], // Calculado automáticamente
      tipo_documento: ['', Validators.required],
      numero_documento: ['', Validators.required],
      ciudad_expedicion: [''],
      ciudad_domicilio: [''],
      barrio: [''],
      direccion_domicilio: [''],
      telefono: [''],
      email: ['', Validators.email],
      celular: ['', Validators.required],
      ocupacion: [''],
      estado_civil: [''],
      eps: [''],
      tipo_afiliacion: [''],
      grupo_sanguineo: [''],
      rh: [''],
      alergias: [''],
      antecedentes: [''],
      antecedentes_familiares: ['']
    });
  }

  ngOnInit(): void {
    // Calcular edad automáticamente cuando cambia la fecha de nacimiento
    this.pacienteForm.get('fecha_nacimiento')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const hoy = new Date();
        const fechaNac = new Date(fecha);
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
          edad--;
        }
        
        this.pacienteForm.patchValue({ edad: edad.toString() });
      }
    });
  }

  // Getter para acceso fácil a los controles del formulario
  get f() { return this.pacienteForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Si el formulario es inválido, detener
    if (this.pacienteForm.invalid) {
      // Mostrar mensajes de error para campos requeridos
      Object.keys(this.f).forEach(key => {
        const control = this.f[key];
        if (control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;
    const pacienteData = {...this.pacienteForm.value};
    pacienteData.edad = this.pacienteForm.get('edad')?.value;
    
    this.pacienteService.crearPaciente(pacienteData).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastr.success('Paciente creado exitosamente', 'Éxito');
        this.router.navigate(['/paciente-dashboard']);
      },
      error: (error) => {
        console.error('Error al guardar paciente:', error);
        this.loading = false;
        this.toastr.error('No se pudo crear el paciente', 'Error');
      }
    });
  }

  onCancel() {
    // Regresar a la lista de pacientes sin guardar
    this.router.navigate(['/paciente-dashboard']);
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.photoFile = input.files[0];
      
      // Crear vista previa de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(this.photoFile);
    }
  }
}