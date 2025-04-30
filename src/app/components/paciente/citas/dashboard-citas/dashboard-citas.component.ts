import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NotificacionService } from '../../../../services/notificacion.service';
import { AgendaService } from '../../../../services/agenda.service';

@Component({
  selector: 'app-dashboard-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard-citas.component.html',
  styleUrl: './dashboard-citas.component.css',
})
export class DashboardCitasComponent implements OnInit {
  @Input() pacienteId: string = '';
  @Input() numeroDocumento: string = '';

  horasOcupadas: string[] = [];
  cargandoHoras: boolean = false;
  // Variables para almacenar datos
  citas: any[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Variables para el modal de nueva cita
  showNewAppointmentModal: boolean = false;
  citaForm: FormGroup;
  savingCita: boolean = false;

  // Fechas disponibles para la agenda (próximos 60 días)
  availableDates: Date[] = [];
  selectedDate: Date | null = null;
  availableHours: string[] = [];
 //variables para la paginación
  paginaActual: number = 1;
  citasPorPagina: number = 6; // Mostrar 6 citas por página
  citasPaginadas: any[] = [];
  constructor(
    private agendaService: AgendaService,
    private notificacionService: NotificacionService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario (sin campo doctor_id ya que no lo necesitas)
    this.citaForm = this.fb.group({
      fecha_cita: ['', Validators.required],
      hora_cita: ['', Validators.required],
      tipo: ['consulta', Validators.required],
      descripcion: [''],
      duracion: [30, Validators.required],
    });

    // Generar fechas disponibles (próximos 60 días)
    this.generateAvailableDates();
  }
  get totalPaginas(): number {
    return Math.ceil(this.citas.length / this.citasPorPagina);
  }
  ngOnInit(): void {
    if (this.numeroDocumento || this.pacienteId) {
      this.cargarCitas();
    } else {
      this.error = 'No se ha proporcionado identificación del paciente';
      this.loading = false;
    }
  }
  actualizarPaginacion(pagina: number = this.paginaActual): void {
    // Validar página
    if (pagina < 1) pagina = 1;
    if (this.totalPaginas > 0 && pagina > this.totalPaginas) {
      pagina = this.totalPaginas;
    }
    
    // Actualizar página actual
    this.paginaActual = pagina;
    
    // Si no hay citas, array vacío
    if (!this.citas || this.citas.length === 0) {
      this.citasPaginadas = [];
      return;
    }
    
    // Calcular índices
    const inicio = (pagina - 1) * this.citasPorPagina;
    const fin = Math.min(inicio + this.citasPorPagina, this.citas.length);
    
    // Obtener las citas para esta página
    this.citasPaginadas = this.citas.slice(inicio, fin);
  }
  
  // Ir a página específica
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaActual) {
      this.actualizarPaginacion(pagina);
    }
  }
  
  // Ir a página anterior
  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.actualizarPaginacion(this.paginaActual - 1);
    }
  }
  
  // Ir a página siguiente
  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.actualizarPaginacion(this.paginaActual + 1);
    }
  }
  cargarCitas(): void {
    this.loading = true;
    // Usar el numeroDocumento si está disponible, de lo contrario usar el ID
    const idPaciente = this.numeroDocumento || this.pacienteId;

    this.agendaService.getCitasByPaciente(idPaciente).subscribe({
      next: (response: any) => {
        this.citas = response.data || [];
        this.loading = false;
        this.actualizarPaginacion(1);
      },
      error: (error: any) => {
        console.error('Error al cargar citas:', error);
        this.error = 'No se pudieron cargar las citas';
        this.loading = false;
      },
    });
  }

  // Métodos para formateo y visualización
  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getEstadoIcon(estado: string): { icon: string; class: string } {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return { icon: '✓', class: 'estado-confirmada' };
      case 'cancelada':
        return { icon: '✗', class: 'estado-cancelada' };
      default:
        return { icon: '?', class: 'estado-programada' };
    }
  }

  // Métodos para el modal de nueva cita
  openNewAppointmentModal(): void {
    this.showNewAppointmentModal = true;
    this.citaForm.reset({
      tipo: 'consulta',
      duracion: 30,
    });
  }

  closeNewAppointmentModal(): void {
    this.showNewAppointmentModal = false;
  }

  // Métodos para la gestión de fechas y horas
  generateAvailableDates(): void {
    const today = new Date();
    this.availableDates = [];

    // Generar fechas para los próximos 60 días
    for (let i = 0; i < 60; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      this.availableDates.push(date);
    }
  }

  onDateSelected(date: Date): void {
    this.selectedDate = date;
    const fechaFormateada = this.formatDateForBackend(date);
    this.citaForm.patchValue({ fecha_cita: fechaFormateada });

    // Indicar que estamos cargando las horas
    this.cargandoHoras = true;

    // Obtener las horas ocupadas para esta fecha
    this.agendaService.getHorasOcupadas(fechaFormateada).subscribe({
      next: (horasOcupadas) => {
        this.horasOcupadas = horasOcupadas;
        this.generateAvailableHours();
        this.cargandoHoras = false;
      },
      error: (error) => {
        console.error('Error al obtener horas ocupadas:', error);
        // Si hay error, generamos todas las horas como disponibles
        this.horasOcupadas = [];
        this.generateAvailableHours();
        this.cargandoHoras = false;
      },
    });
  }

  formatDateForBackend(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  generateAvailableHours(): void {
    // Resetear las horas disponibles
    this.availableHours = [];

    // Generar horas de 8:00 a 17:00
    const horasPosibles: string[] = [];
    for (let hour = 8; hour <= 17; hour++) {
      horasPosibles.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 17) {
        horasPosibles.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }

    // Filtrar las horas ocupadas
    this.availableHours = horasPosibles.filter((hora) => {
      // Verificar si esta hora está en el arreglo de horas ocupadas
      const estaOcupada = this.horasOcupadas.some((horaOcupada) => {
        // Comparar solo la hora y minutos, ignorando segundos
        return horaOcupada.substring(0, 5) === hora;
      });

      // Incluir solo si NO está ocupada
      return !estaOcupada;
    });

    // Si es el día actual, filtrar horas pasadas
    const today = new Date();
    if (
      this.selectedDate &&
      this.selectedDate.getDate() === today.getDate() &&
      this.selectedDate.getMonth() === today.getMonth() &&
      this.selectedDate.getFullYear() === today.getFullYear()
    ) {
      const horaActual = today.getHours();
      const minutosActuales = today.getMinutes();

      // Filtrar horas que ya han pasado
      this.availableHours = this.availableHours.filter((hora) => {
        const [horaStr, minutosStr] = hora.split(':');
        const horaNum = parseInt(horaStr, 10);
        const minutosNum = parseInt(minutosStr, 10);

        // Comparar con la hora actual
        if (horaNum > horaActual) return true;
        if (horaNum === horaActual && minutosNum > minutosActuales) return true;
        return false;
      });
    }

    // Si no quedan horas disponibles, mostrar mensaje
    if (this.availableHours.length === 0) {
      this.notificacionService.info('No hay horas disponibles para esta fecha');
    }
  }

  onHourSelected(hour: string): void {
    this.citaForm.patchValue({ hora_cita: hour });
  }

  // Método para guardar la cita
  saveCita(): void {
    if (this.citaForm.invalid) {
      this.notificacionService.warning(
        'Por favor complete todos los campos requeridos'
      );
      return;
    }

    this.savingCita = true;

    // Preparar los datos para crear la cita en el formato que espera AgendaService
    const citaData = {
      ...this.citaForm.value,
      numero_documento: this.numeroDocumento,
      paciente_id: this.pacienteId,
      isRegistered: true, // Las citas desde este componente son siempre de pacientes registrados
      date: this.citaForm.get('fecha_cita')?.value,
      time: this.citaForm.get('hora_cita')?.value,
      notes: this.citaForm.get('descripcion')?.value,
      duration: this.citaForm.get('duracion')?.value,
      patientId: this.pacienteId || this.numeroDocumento,
    };

    // Usar el método existente en AgendaService
    this.agendaService.createAppointment(citaData).subscribe({
      next: (response: any) => {
        this.savingCita = false;
        this.notificacionService.success('Cita creada correctamente');
        this.closeNewAppointmentModal();
        this.cargarCitas(); // Recargar citas
      },
      error: (error: any) => {
        this.savingCita = false;
        console.error('Error al crear cita:', error);
        this.notificacionService.error('Error al crear la cita');
      },
    });
  }

  // Helper para determinar si una cita es pasada
  isCitaPasada(fecha: string): boolean {
    const today = new Date();
    const citaDate = new Date(fecha);
    return citaDate < today;
  }
}
