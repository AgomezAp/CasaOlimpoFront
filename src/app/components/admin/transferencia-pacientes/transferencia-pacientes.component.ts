import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificacionService } from '../../../services/notificacion.service';
import { UsuarioService } from '../../../services/usuario.service';
import { PacienteService } from '../../../services/paciente.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transferencia-pacientes',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './transferencia-pacientes.component.html',
  styleUrl: './transferencia-pacientes.component.css'
})
export class TransferenciaPacientesComponent implements OnInit {
  transferenciaForm: FormGroup;
  doctores: any[] = [];
  pacientes: any[] = [];
  pacientesFiltrados: any[] = [];
  pacientesSeleccionados: any[] = [];
  
  cargandoDoctores: boolean = false;
  cargandoPacientes: boolean = false;
  procesandoTransferencia: boolean = false;
  
  filtroTexto: string = '';
  
  get doctorOrigenId(): string {
    return this.transferenciaForm.get('doctorOrigen')?.value;
  }
  
  get doctorDestinoId(): string {
    return this.transferenciaForm.get('doctorDestino')?.value;
  }

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private pacienteService: PacienteService,
    private notificacionService: NotificacionService
  ) {
    this.transferenciaForm = this.fb.group({
      doctorOrigen: ['', Validators.required],
      doctorDestino: ['', Validators.required],
      comentario: ['']
    });
    
    // Escuchar cambios en el doctor origen para cargar sus pacientes
    this.transferenciaForm.get('doctorOrigen')?.valueChanges.subscribe(id => {
      if (id) {
        this.cargarPacientesPorDoctor(id);
        this.pacientesSeleccionados = []; // Limpiar seleccionados al cambiar de doctor
      } else {
        this.pacientes = [];
        this.pacientesFiltrados = [];
      }
    });
    
    // Validar que no se seleccione el mismo doctor como origen y destino
    this.transferenciaForm.valueChanges.subscribe(() => {
      const origen = this.transferenciaForm.get('doctorOrigen')?.value;
      const destino = this.transferenciaForm.get('doctorDestino')?.value;
      
      if (origen && destino && origen === destino) {
        this.transferenciaForm.get('doctorDestino')?.setErrors({ 'mismoDoctorError': true });
      }
    });
  }

  ngOnInit(): void {
    this.cargarDoctores();
  }

  cargarDoctores(): void {
    this.cargandoDoctores = true;
    this.usuarioService.obtenerDoctores().subscribe({
      next: (response) => {
        console.log('Respuesta de doctores original:', response.data);
        
        // Mapear el formato para usar los IDs correctos
        this.doctores = response.data.map((doctor: any) => {
          const mappedDoctor = {
            id: doctor.Uid, // Asumiendo que el ID viene como Uid
            Uid: doctor.Uid, // Mantener también el Uid original
            nombre: doctor.nombre,
            apellidos: doctor.apellidos || '',
            correo: doctor.correo,
            rol: doctor.rol
          };
          console.log('Doctor mapeado:', mappedDoctor);
          return mappedDoctor;
        });
        
        console.log('Lista completa de doctores:', this.doctores);
        this.cargandoDoctores = false;
      },
      error: (error) => {
        console.error('Error al cargar doctores:', error);
        this.notificacionService.error('No se pudieron cargar los doctores');
        this.cargandoDoctores = false;
      }
    });
  }

  cargarPacientesPorDoctor(doctorId: string): void {
    this.cargandoPacientes = true;
    
    // Usar el nuevo método que acepta doctorId como parámetro
    this.pacienteService.obtenerPacientesPorDoctorId(doctorId).subscribe({
      next: (response) => {
        this.pacientes = response.data || [];
        this.aplicarFiltro(); // Aplicar cualquier filtro existente
        this.cargandoPacientes = false;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.notificacionService.error('No se pudieron cargar los pacientes');
        this.cargandoPacientes = false;
      }
    });
  }

  filtrarPacientes(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroTexto = input.value.toLowerCase();
    this.aplicarFiltro();
  }
  
  aplicarFiltro(): void {
    if (!this.filtroTexto) {
      this.pacientesFiltrados = [...this.pacientes];
      return;
    }
    
    this.pacientesFiltrados = this.pacientes.filter(paciente => 
      paciente.nombre.toLowerCase().includes(this.filtroTexto) || 
      (paciente.apellidos && paciente.apellidos.toLowerCase().includes(this.filtroTexto)) ||
      paciente.numero_documento.toLowerCase().includes(this.filtroTexto)
    );
  }

  toggleSeleccionPaciente(paciente: any): void {
    if (!paciente) return;
    
    const yaSeleccionado = this.estaPacienteSeleccionado(paciente);
    
    if (yaSeleccionado) {
      // Remover de seleccionados
      this.pacientesSeleccionados = this.pacientesSeleccionados.filter(p => 
        p.numero_documento !== paciente.numero_documento
      );
    } else {
      // Agregar a seleccionados
      this.pacientesSeleccionados = [...this.pacientesSeleccionados, paciente];
    }
    
    // Opcional: feedback visual
    console.log(`Paciente ${paciente.nombre} ${yaSeleccionado ? 'deseleccionado' : 'seleccionado'}`);
    console.log('Total seleccionados:', this.pacientesSeleccionados.length);
  }
  estaPacienteSeleccionado(paciente: any): boolean {
    if (!this.pacientesSeleccionados || !paciente) return false;
    
    // Usar el número de documento como identificador único
    return this.pacientesSeleccionados.some(p => 
      p.numero_documento === paciente.numero_documento
    );
  }

  seleccionarTodos(): void {
    if (this.pacientesSeleccionados.length === this.pacientesFiltrados.length) {
      // Si todos están seleccionados, deseleccionar todos
      this.pacientesSeleccionados = [];
    } else {
      // Seleccionar todos los filtrados
      this.pacientesSeleccionados = [...this.pacientesFiltrados];
    }
  }

  transferirPacientes(): void {
    if (this.transferenciaForm.invalid) {
      this.transferenciaForm.markAllAsTouched();
      return;
    }
    
    if (!this.pacientesSeleccionados || this.pacientesSeleccionados.length === 0) {
      this.notificacionService.warning('Debe seleccionar al menos un paciente para transferir');
      return;
    }
    
    // LOG: Valores del formulario
    console.log('Valores del formulario:', this.transferenciaForm.value);
    console.log('Doctor origen ID (desde form):', this.doctorOrigenId, typeof this.doctorOrigenId);
    console.log('Doctor destino ID (desde form):', this.doctorDestinoId, typeof this.doctorDestinoId);
    
    // Verificar que los pacientes pertenecen al doctor origen
    const verificacionPacientes = this.pacientesSeleccionados.every(p => {
      // Convertir IDs a string para comparación consistente
      const pacienteUid = String(p.Uid || '');
      const pacienteDoctorId = String(p.doctor_id || '');
      const doctorOrigenIdStr = String(this.doctorOrigenId || '');
      
      // LOG: Comparación de IDs para cada paciente
      console.log('Comparando paciente:', {
        nombre: p.nombre,
        pacienteUid,
        pacienteDoctorId,
        doctorOrigenIdStr,
        coincide: (pacienteUid === doctorOrigenIdStr || pacienteDoctorId === doctorOrigenIdStr)
      });
      
      return pacienteUid === doctorOrigenIdStr || pacienteDoctorId === doctorOrigenIdStr;
    });
    
    if (!verificacionPacientes) {
      this.notificacionService.warning('Algunos pacientes seleccionados no pertenecen al doctor origen');
      return;
    }
    
    // Confirmación antes de transferir
    const confirmMessage = `¿Está seguro de transferir ${this.pacientesSeleccionados.length} pacientes del Dr. ${this.getDoctorNombre(this.doctorOrigenId)} al Dr. ${this.getDoctorNombre(this.doctorDestinoId)}?`;
    
    if (confirm(confirmMessage)) {
      this.procesandoTransferencia = true;
      
      // LOG: Lista completa de doctores antes de búsqueda
      console.log('Lista de doctores disponibles:', this.doctores);
      console.log('Buscando doctor origen con ID:', this.doctorOrigenId);
      console.log('Buscando doctor destino con ID:', this.doctorDestinoId);
      
      const doctorOrigen = this.doctores.find(d => Number(d.id) === Number(this.doctorOrigenId));
      const doctorDestino = this.doctores.find(d => Number(d.id) === Number(this.doctorDestinoId));
      
      // LOG: Intentar con otras formas de comparación
      const doctorDestinoAlt1 = this.doctores.find(d => String(d.id) === String(this.doctorDestinoId));
      console.log('Doctor destino (con conversión string):', doctorDestinoAlt1);
      
      const doctorDestinoAlt2 = this.doctores.find(d => Number(d.id) === Number(this.doctorDestinoId));
      console.log('Doctor destino (con conversión number):', doctorDestinoAlt2);
      
      if (!doctorDestino) {
        this.notificacionService.error('Doctor destino no encontrado');
        this.procesandoTransferencia = false;
        return;
      }
      
      if (doctorDestino.rol !== 'Doctor') {
        this.notificacionService.error('El usuario seleccionado como destino no tiene rol de Doctor');
        this.procesandoTransferencia = false;
        return;
      }
      
      const transferData = {
        doctorOrigenId: Number(this.doctorOrigenId), // Convertir a número
        doctorDestinoId: Number(this.doctorDestinoId), // Convertir a número
        pacientesIds: this.pacientesSeleccionados.map(p => p.numero_documento),
        comentario: this.transferenciaForm.get('comentario')?.value || ''
      };
      
      // LOG: Datos finales para transferencia
      console.log('Datos para transferencia:', transferData);
      
      // Transferir pacientes individualmente para mejor manejo de errores
      this.transferirPacientesSecuencial(transferData);
    }
  }
  
  // Nuevo método para transferencia secuencial
  transferirPacientesSecuencial(transferData: any): void {
    let completados = 0;
    let fallidos = 0;
    let errores: string[] = [];
    
    // Transferir un paciente a la vez
    const transferirSiguiente = (index: number) => {
      if (index >= transferData.pacientesIds.length) {
        // Proceso completado
        if (fallidos === 0) {
          this.notificacionService.success(`Se transfirieron ${completados} pacientes correctamente`);
        } else {
          let mensaje = `Se transfirieron ${completados} pacientes. ${fallidos} transferencias fallaron.`;
          if (errores.length > 0) {
            mensaje += `\nErrores: ${errores.slice(0, 3).join(', ')}`;
            if (errores.length > 3) {
              mensaje += ` y ${errores.length - 3} más`;
            }
          }
          this.notificacionService.warning(mensaje);
        }
        
        this.resetForm();
        this.procesandoTransferencia = false;
        return;
      }
      
      const pacienteId = transferData.pacientesIds[index];
      this.pacienteService.transferirPaciente(
        pacienteId,
        transferData.doctorOrigenId,
        transferData.doctorDestinoId,
        transferData.comentario
      ).subscribe({
        next: () => {
          completados++;
          transferirSiguiente(index + 1);
        },
        error: (error) => {
          fallidos++;
          let mensajeError = error.error?.message || error.error?.msg || 'Error desconocido';
          errores.push(`Paciente ${pacienteId}: ${mensajeError}`);
          console.error(`Error al transferir paciente ${pacienteId}:`, error);
          
          // Continuar con el siguiente paciente
          transferirSiguiente(index + 1);
        }
      });
    };
    
    // Iniciar proceso
    transferirSiguiente(0);
  }

  resetForm(): void {
    this.transferenciaForm.reset();
    this.pacientes = [];
    this.pacientesFiltrados = [];
    this.pacientesSeleccionados = [];
    this.filtroTexto = '';
  }
  
  getDoctorNombre(doctorId: string): string {
    const doctor = this.doctores.find(d => d.id === doctorId);
    return doctor ? `${doctor.nombre} ${doctor.apellidos}` : 'Desconocido';
  }
}