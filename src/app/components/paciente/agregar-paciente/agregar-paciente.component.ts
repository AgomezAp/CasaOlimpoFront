import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PacienteService } from '../../../services/paciente.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificacionService } from '../../../services/notificacion.service';

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
  mostrarOverlay = false;
  mensajeOverlay = '';
  pacienteCreado: boolean = false;
  numeroDocumentoCreado: string = '';
  sexoOpciones: string[] = ['Masculino', 'Femenino', 'Otro'];
  tiposDocumentoPermitidos: string[] = ['Cedula', 'Tarjeta de identidad', 'Cedula de extranjeria', 'Pasaporte', 'Otro'];
  estadoCivilOpciones: string[] = ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Union libre'];
  tipoAfiliacionOpciones: string[] = ['Contributivo', 'Subsidiado', 'Particular'];
  grupoSanguineoOpciones: string[] = ['A', 'B', 'AB', 'O'];
  rhOpciones: string[] = ['+', '-'];
  maxDate!: string;
  constructor(
    private formBuilder: FormBuilder,
    private pacienteService: PacienteService,
    private router: Router,
    private notificacionService: NotificacionService
  ) {
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    
    this.pacienteForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      fecha_nacimiento: ['', [Validators.required, this.fechaNoFutura.bind(this)]],
      sexo: [this.sexoOpciones[0]], // Valor por defecto
      ciudad_nacimiento: [''],
      edad: [{value: '', disabled: true}],
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
      estado_civil: [this.estadoCivilOpciones[0]], // Valor por defecto
      eps: [''],
      tipo_afiliacion: [this.tipoAfiliacionOpciones[0]], // Valor por defecto
      grupo_sanguineo: [this.grupoSanguineoOpciones[3]], // Valor por defecto: 'O'
      rh: [this.rhOpciones[0]], // Valor por defecto: '+'
      alergias: [''],
      antecedentes: [''],
      antecedentes_familiares: ['']
    });
  }
  fechaNoFutura(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) {
      return null; // No validar si está vacío
    }
    
    const fechaIngresada = new Date(control.value);
    const hoy = new Date();
    
    // Resetear las horas para comparar solo las fechas
    hoy.setHours(0, 0, 0, 0);
    fechaIngresada.setHours(0, 0, 0, 0);
    
    return fechaIngresada > hoy ? { 'fechaFutura': true } : null;
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

  get f() { return this.pacienteForm.controls; }

  onSubmit() {
  this.submitted = true;

  // Si el formulario es inválido, mostrar advertencia y detener
  if (this.pacienteForm.invalid) {
    const camposFaltantes = [];
    const controles = this.f;
    
    // Verificación de fecha futura
    if (controles['fecha_nacimiento'].errors) {
      if (controles['fecha_nacimiento'].errors['required']) {
        camposFaltantes.push('Fecha de nacimiento');
      } else if (controles['fecha_nacimiento'].errors['fechaFutura']) {
        this.notificacionService.error('La fecha de nacimiento no puede ser posterior a la fecha actual');
        return;
      }
    }
    
    // Verificación de otros campos obligatorios
    if (controles['nombre'].invalid) camposFaltantes.push('Nombre');
    if (controles['apellidos'].invalid) camposFaltantes.push('Apellidos');
    if (controles['tipo_documento'].invalid) camposFaltantes.push('Tipo de documento');
    if (controles['numero_documento'].invalid) camposFaltantes.push('Número de documento');
    if (controles['celular'].invalid) camposFaltantes.push('Celular');
    
    if (camposFaltantes.length > 0) {
      this.notificacionService.warning(`Faltan campos obligatorios: ${camposFaltantes.join(', ')}`);
      
      // Marcar todos los campos con errores
      Object.keys(this.f).forEach(key => {
        const control = this.f[key];
        if (control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }
  }

  // Mostrar overlay de carga
  this.mostrarOverlay = true;
  this.mensajeOverlay = 'Guardando información del paciente...';
  
  // Preparar datos del paciente y aplicar verificación de ENUM
  let pacienteData = {...this.pacienteForm.value};
  
  // Incluir edad calculada
  if (this.pacienteForm.get('edad')?.value) {
    pacienteData.edad = this.pacienteForm.get('edad')?.value;
  }
  
  // Verificar y corregir valores ENUM
  pacienteData = this.verificarValoresEnum(pacienteData);
  
  
  // Primer paso: Crear el paciente (operación independiente)
  this.pacienteService.crearPaciente(pacienteData).subscribe({
    next: (response) => {
      this.pacienteCreado = true;
      this.numeroDocumentoCreado = pacienteData.numero_documento;
      
      // Si hay foto, subirla inmediatamente sin preguntar
      if (this.photoFile) {
        this.subirFoto();
      } else {
        // Si no hay foto, finalizar el proceso directamente
        this.finalizarProceso();
      }
    },
    error: (error) => {
      console.error('Error al crear paciente:', error);
      this.mostrarOverlay = false;
      
      // Mostrar mensaje de error detallado
      if (error.error && error.error.message) {
        this.notificacionService.error(error.error.message);
      } else {
        this.notificacionService.error('No se pudo crear el paciente. Por favor, revise los datos e intente nuevamente.');
      }
    }
  });
}



  // Método independiente para subir la foto
  subirFoto() {
    if (!this.photoFile || !this.numeroDocumentoCreado) {
      this.finalizarProceso();
      return;
    }
  
    this.mensajeOverlay = 'Subiendo foto del paciente...';
    
    this.pacienteService.actualizarFotoPaciente(this.numeroDocumentoCreado, this.photoFile).subscribe({
      next: (response) => {
        console.log('Foto subida exitosamente:', response);
        // No mostrar toast adicional - ya se mostrará un mensaje de éxito en finalizarProceso
        this.finalizarProceso(true);
      },
      error: (error) => {
        console.error('Error al subir la foto:', error);
        // Mantener el mensaje de advertencia
        this.notificacionService.warning('El paciente se creó correctamente, pero hubo un problema al guardar la foto');
        this.finalizarProceso(false);
      }
    });
  }

  // Método para finalizar el proceso completo
  finalizarProceso(fotoSubida: boolean = false) {
    this.mostrarOverlay = false;
    
    if (this.pacienteCreado) {
      if (fotoSubida) {
        this.notificacionService.success('Paciente creado exitosamente con foto');
      } else {
        this.notificacionService.success('Paciente creado exitosamente');
      }
      
      // Navegar al dashboard de pacientes
      setTimeout(() => {
        this.router.navigate(['/paciente-dashboard']);
      }, 500);
    }
  }
  verificarValoresEnum(datos: any): any {
    const datosCorregidos = { ...datos };
    
    // Verificar que el sexo sea válido
    if (!this.sexoOpciones.includes(datosCorregidos.sexo)) {
      datosCorregidos.sexo = this.sexoOpciones[0]; // Valor por defecto
    }
    
    // Verificar otros campos ENUM
    if (!this.estadoCivilOpciones.includes(datosCorregidos.estado_civil)) {
      datosCorregidos.estado_civil = this.estadoCivilOpciones[0];
    }
    
    if (!this.tipoAfiliacionOpciones.includes(datosCorregidos.tipo_afiliacion)) {
      datosCorregidos.tipo_afiliacion = this.tipoAfiliacionOpciones[0];
    }
    
    if (!this.grupoSanguineoOpciones.includes(datosCorregidos.grupo_sanguineo)) {
      datosCorregidos.grupo_sanguineo = this.grupoSanguineoOpciones[3]; // 'O'
    }
    
    if (!this.rhOpciones.includes(datosCorregidos.rh)) {
      datosCorregidos.rh = this.rhOpciones[0]; // '+'
    }
    
    return datosCorregidos;
  }
  onCancel() {
    // Regresar a la lista de pacientes sin guardar
    this.router.navigate(['/paciente-dashboard']);
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
        this.notificacionService.error('El archivo debe ser una imagen (JPEG, PNG o GIF)');
        input.value = '';
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificacionService.error('La imagen no debe superar los 5MB');
        input.value = '';
        return;
      }
      
      this.photoFile = file;
       
      // Crear vista previa de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(this.photoFile);
    }
  }
}