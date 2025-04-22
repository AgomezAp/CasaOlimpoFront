import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RedFamiliar } from '../../../interfaces/redfamiliar';
import { RedFamiliarResponse, RedfamiliarService } from '../../../services/redfamiliar.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificacionService } from '../../../services/notificacion.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
@Component({
  selector: 'app-red-familiar',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './red-familiar.component.html',
  styleUrl: './red-familiar.component.css'
})
export class RedFamiliarComponent implements OnInit, OnChanges {
  @Input() pacienteId: string = '';
  @Input() esPacienteMenor: boolean = false;

  miembroForm: FormGroup;
  miembros: RedFamiliar[] = [];
  paciente: any = null;
  
  // Estados de la UI
  cargando: boolean = false;
  guardando: boolean = false;
  eliminando: boolean = false;
  cambiandoResponsable: boolean = false;
  
  // Estado de los modales
  mostrarModal: boolean = false;
  mostrarConfirmacion: boolean = false;
  mostrarConfirmacionResponsable: boolean = false;
  
  // Estado de edición
  modoEdicion: boolean = false;
  miembroId: number | null = null;
  miembroAEliminar: RedFamiliar | null = null;
  miembroAResponsable: RedFamiliar | null = null;
  
  // Control para pacientes menores
  hayResponsable: boolean = false;

  constructor(
    private fb: FormBuilder,
    private redFamiliarService: RedfamiliarService,
    private notificacionService: NotificacionService,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.miembroForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      numero_documento: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      es_responsable: [false]
    });
  }
  volver(): void {
    this.location.back();
  }
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['numero_documento']) {
        this.pacienteId = params['numero_documento'];
        console.log('ID de paciente obtenido de la URL:', this.pacienteId);
        this.cargarRedFamiliar();
        
        // También podríamos verificar si es menor de edad aquí
        this.verificarEdadPaciente();
      } else if (this.pacienteId) {
        // Si no viene de la URL pero ya tenemos un ID (vía @Input)
        this.cargarRedFamiliar();
      } else {
        console.error('No se pudo obtener el ID del paciente ni de la URL ni como Input');
        this.notificacionService.error('Error: No se pudo identificar al paciente');
      }
    });
  }
  verificarEdadPaciente(): void {
    if (!this.pacienteId) return;
    
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pacienteId'] && !changes['pacienteId'].firstChange && this.pacienteId) {
      this.cargarRedFamiliar();
    }
  }

  // Getter para acceder fácilmente a los controles del formulario
  get f() { 
    return this.miembroForm.controls; 
  }

  cargarRedFamiliar(): void {
    if (!this.pacienteId) return;

    this.cargando = true;
    this.redFamiliarService.obtenerRedFamiliar(this.pacienteId).subscribe({
      next: (response: RedFamiliarResponse) => {
        this.miembros = response.data.miembros_red_familiar;
        this.paciente = response.data.paciente;
        this.hayResponsable = this.miembros.some(m => m.es_responsable);
        this.cargando = false;
      },
      error: (error:any) => {
        console.error('Error al cargar la red familiar:', error);
        this.notificacionService.error('No se pudo cargar la red familiar');
        this.cargando = false;
      }
    });
  }

  abrirModalNuevo(): void {
    this.resetForm();
    this.modoEdicion = false;
    this.miembroId = null;
    
    // Si es menor de edad y no hay responsable, forzar es_responsable a true
    if (this.esPacienteMenor && !this.hayResponsable) {
      this.miembroForm.get('es_responsable')?.setValue(true);
      this.miembroForm.get('es_responsable')?.disable();
    }
    
    this.mostrarModal = true;
  }

  abrirModalEdicion(miembro: RedFamiliar): void {
    this.resetForm();
    this.modoEdicion = true;
    this.miembroId = miembro.Nid;
    
    this.miembroForm.patchValue({
      nombre: miembro.nombre,
      apellido: miembro.apellido,
      numero_documento: miembro.numero_documento,
      telefono: miembro.telefono,
      correo: miembro.correo,
      es_responsable: miembro.es_responsable
    });

    // Si es responsable y el paciente es menor, no permitir desmarcar la opción
    if (miembro.es_responsable && this.esPacienteMenor && !this.hayResponsableDiferente(miembro.Nid)) {
      this.miembroForm.get('es_responsable')?.disable();
    }
    
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  resetForm(): void {
    this.miembroForm.reset({
      nombre: '',
      apellido: '',
      numero_documento: '',
      telefono: '',
      correo: '',
      es_responsable: false
    });
    
    // Reactivar controles que pudieran estar desactivados
    this.miembroForm.get('es_responsable')?.enable();
    
    // Limpiar estado de validación
    Object.keys(this.miembroForm.controls).forEach(key => {
      this.miembroForm.get(key)?.markAsUntouched();
    });
  }

  guardarMiembro(): void {
    // Validar el formulario
    if (this.miembroForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.miembroForm.controls).forEach(key => {
        this.miembroForm.get(key)?.markAsTouched();
      });
      return;
    }
  
    // Verificar que tenemos un ID de paciente válido
    if (!this.pacienteId || this.pacienteId.trim() === '') {
      console.error('ID de paciente inválido o vacío:', this.pacienteId);
      this.notificacionService.error('Error: No se pudo identificar al paciente');
      return;
    }
  
    console.log('Guardando miembro para paciente con ID:', this.pacienteId);
    
    this.guardando = true;
    
    // Obtener los valores del formulario asegurando que es un nuevo objeto
    const miembroData = { ...this.miembroForm.value };
  
    // Si es_responsable está deshabilitado pero debería ser true
    if (this.miembroForm.get('es_responsable')?.disabled && 
        this.esPacienteMenor && !this.hayResponsable) {
      miembroData.es_responsable = true;
    }
  
    try {
      if (this.modoEdicion && this.miembroId) {
        // Actualizar miembro existente
        this.redFamiliarService.actualizarMiembroRedFamiliar(this.miembroId, miembroData)
          .subscribe({
            next: (response) => {
              console.log('Miembro actualizado con éxito:', response);
              this.notificacionService.success('Miembro actualizado correctamente');
              this.cargarRedFamiliar();
              this.cerrarModal();
            },
            error: (error) => {
              console.error('Error detallado al actualizar miembro:', error);
              let mensajeError = 'No se pudo actualizar el miembro';
              if (error.error?.message) {
                mensajeError = error.error.message;
              }
              this.notificacionService.error(mensajeError);
            },
            complete: () => {
              this.guardando = false;
            }
          });
      } else {
        // Crear nuevo miembro - aseguramos que el ID del paciente es válido
        console.log('Datos a enviar:', { pacienteId: this.pacienteId, miembro: miembroData });
        
        this.redFamiliarService.crearMiembroRedFamiliar(this.pacienteId, miembroData)
          .subscribe({
            next: (response) => {
              console.log('Miembro creado con éxito:', response);
              this.notificacionService.success('Miembro agregado correctamente');
              this.cargarRedFamiliar();
              this.cerrarModal();
            },
            error: (error) => {
              console.error('Error detallado al crear miembro:', error);
              let errorMessage = 'No se pudo agregar el miembro';
              
              // Analizar el error para dar un mensaje más específico
              if (error.status === 404) {
                errorMessage = 'No se encontró el paciente o la ruta es incorrecta';
              } else if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (typeof error.error === 'string' && error.error.includes('Cannot POST')) {
                errorMessage = 'Error en la ruta de la API. Contacte al administrador.';
              }
              
              this.notificacionService.error(errorMessage);
            },
            complete: () => {
              this.guardando = false;
            }
          });
      }
    } catch (e) {
      console.error('Error inesperado:', e);
      this.notificacionService.error('Ocurrió un error inesperado');
      this.guardando = false;
    }
  }

  confirmarEliminacion(miembro: RedFamiliar): void {
    this.miembroAEliminar = miembro;
    this.mostrarConfirmacion = true;
  }

  cancelarConfirmacion(): void {
    this.miembroAEliminar = null;
    this.mostrarConfirmacion = false;
  }

  eliminarMiembro(): void {
    if (!this.miembroAEliminar) return;

    this.eliminando = true;
    this.redFamiliarService.eliminarMiembroRedFamiliar(this.miembroAEliminar.Nid).subscribe({
      next: (response:any) => {
        this.notificacionService.success('Miembro eliminado correctamente');
        this.cargarRedFamiliar();
        this.cancelarConfirmacion();
        this.eliminando = false;
      },
      error: (error:any) => {
        console.error('Error al eliminar miembro:', error);
        this.notificacionService.error(error.error?.message || 'No se pudo eliminar el miembro');
        this.eliminando = false;
      }
    });
  }
  
  confirmarEstablecerResponsable(miembro: RedFamiliar): void {
    this.miembroAResponsable = miembro;
    this.mostrarConfirmacionResponsable = true;
  }
  
  cancelarConfirmacionResponsable(): void {
    this.miembroAResponsable = null;
    this.mostrarConfirmacionResponsable = false;
  }
  
  establecerResponsable(): void {
    if (!this.miembroAResponsable) return;
    
    this.cambiandoResponsable = true;
    this.redFamiliarService.establecerResponsable(this.miembroAResponsable.Nid).subscribe({
      next: (response:any) => {
        this.notificacionService.success('Responsable legal establecido correctamente');
        this.cargarRedFamiliar();
        this.cancelarConfirmacionResponsable();
        this.cambiandoResponsable = false;
      },
      error: (error:any) => {
        console.error('Error al establecer responsable:', error);
        this.notificacionService.error(error.error?.message || 'No se pudo establecer el responsable');
        this.cambiandoResponsable = false;
      }
    });
  }
  
  // Verificar si hay otro responsable aparte del miembro actual
  hayResponsableDiferente(miembroId: number): boolean {
    return this.miembros.some(m => m.es_responsable && m.Nid !== miembroId);
  }

}
