import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Consulta } from '../../../interfaces/consulta';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../services/consulta.service';

@Component({
  selector: 'app-editar-datos',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-datos.component.html',
  styleUrl: './editar-datos.component.css'
})
export class EditarDatosComponent implements OnInit {
  consultaForm: FormGroup;
  consulta: Consulta | null = null;
  Cid: number = 0;
  numeroDocumento: string = '';
  cargando: boolean = true;
  guardando: boolean = false;
  error: string = '';
  tieneConsentimiento: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consultaService: ConsultaService
  ) {
    // Inicializar el formulario vacío
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
    // Obtener parámetros de la URL
    this.route.params.subscribe(params => {
      this.numeroDocumento = params['numero_documento'];
      this.Cid = +params['consulta_id']; // Convertir a número
      
      if (this.numeroDocumento && this.Cid) {
        this.cargarDatosConsulta();
      } else {
        this.error = 'No se pudo identificar la consulta a editar';
        this.cargando = false;
      }
    });
  }

  cargarDatosConsulta(): void {
    this.cargando = true;
    this.error = '';
    
    this.consultaService.obtenerConsultaPorId(this.Cid)
      .pipe(
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe({
        next: (consulta) => {
          this.consulta = consulta;
          
          // Cargar los valores en el formulario
          this.consultaForm.patchValue({
            motivo: consulta.motivo || '',
            enfermedad_actual: consulta.enfermedad_actual || '',
            objetivos_terapia: consulta.objetivos_terapia || '',
            historia_problema: consulta.historia_problema || '',
            tipo_diagnostico: consulta.tipo_diagnostico || '',
            plan_tratamiento: consulta.plan_tratamiento || '',
            recomendaciones: consulta.recomendaciones || '',
            contraindicaciones:consulta.contraindicaciones|| ''
          });
        },
        error: (err) => {
          console.error('Error al cargar la consulta:', err);
          this.error = 'No se pudo cargar la información de la consulta: ' + 
                       (err.message || 'Error desconocido');
        }
      });
  }


  guardarCambios(): void {
    if (this.consultaForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.consultaForm.controls).forEach(key => {
        this.consultaForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.guardando = true;
    
    // Crear objeto con los campos actualizados
    const consultaActualizada: Partial<Consulta> = {
      ...this.consultaForm.value
    };
    
    this.consultaService.actualizarConsulta(this.numeroDocumento, this.Cid, consultaActualizada)
      .pipe(
        finalize(() => {
          this.guardando = false;
        })
      )
      .subscribe({
        next: () => {
          alert('Consulta actualizada correctamente');
          this.router.navigate(['/info-paciente', this.numeroDocumento]);
        },
        error: (err) => {
          console.error('Error al actualizar la consulta:', err);
          this.error = 'No se pudo actualizar la consulta: ' + (err.message || 'Error desconocido');
          alert(this.error);
        }
      });
  }

  cancelar(): void {
    // Verificar si hay cambios sin guardar
    if (this.consultaForm.dirty && !this.guardando) {
      if (confirm('¿Está seguro de cancelar? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/info-paciente', this.numeroDocumento]);
      }
    } else {
      this.router.navigate(['/info-paciente', this.numeroDocumento]);
    }
  }

  // Helper para validaciones de formulario
  isFieldInvalid(fieldName: string): boolean {
    const control = this.consultaForm.get(fieldName);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }
}