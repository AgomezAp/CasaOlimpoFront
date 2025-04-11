import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AgendaService } from '../../../services/agenda.service';
import { PacienteService } from '../../../services/paciente.service';
import { CommonModule } from '@angular/common';
import { NotificacionService } from '../../../services/notificacion.service';
import { NotificacionComponent } from '../../notificaciones/notificacion/notificacion.component';

@Component({
  selector: 'app-agenda-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './agenda-dashboard.component.html',
  styleUrl: './agenda-dashboard.component.css',
})
export class AgendaDashboardComponent implements OnInit {
  // Variables para la vista de calendario
  viewMode: 'month' | 'week' | 'day' = 'month';
  currentDate: Date = new Date();
  currentYear: number = this.currentDate.getFullYear();
  currentMonth: number = this.currentDate.getMonth();
  currentMonthName: string = '';
  selectedDay: Date = new Date();
  selectedDayFormatted: string = '';
  calendarDays: any[] = [];
  weekDays: any[] = [];
  dayAppointments: any[] = [];
  allPatients: any[] = [];
  // Variables para filtrado
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';

  // Variables para hora
  hours: string[] = [];

  // Modal nueva cita
  showNewAppointmentModal: boolean = false;
  appointmentForm: FormGroup;
  patientType: 'registered' | 'unregistered' = 'registered';
  searchResults: any[] = [];
  selectedPatient: any = null;
  saving: boolean = false;

  // Modal detalles de cita
  showAppointmentDetailsModal: boolean = false;
  selectedAppointment: any = null;

  // Lista de citas
  appointments: any[] = [];
  filteredAppointments: any[] = [];

  constructor(
    private fb: FormBuilder,
    private agendaService: AgendaService,
    private pacienteService: PacienteService,
    private notificacionService: NotificacionService
  ) {
    this.appointmentForm = this.fb.group({
      patientSearch: [''],
      unregisteredName: [''],
      unregisteredLastName: [''],
      unregisteredPhone: [''],
      unregisteredEmail: ['', [Validators.email]],
      date: ['', [Validators.required]],
      time: ['', [Validators.required]],
      appointmentType: ['first', [Validators.required]],
      duration: ['60', [Validators.required]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.updateMonthName();
    this.loadCalendarDays();
    this.loadWeekDays();
    this.updateSelectedDayFormatted();
    this.loadAppointments();
    this.loadAllPatients();
    this.generateHours(7, 20);
  }
  generateHours(startHour: number, endHour: number): void {
    this.hours = [];
    for (let i = startHour; i <= endHour; i++) {
      this.hours.push(i.toString().padStart(2, '0') + ':00');
    }
    
  }
  loadAllPatients(): void {
    this.pacienteService.obtenerPacientes().subscribe(
      (response: any) => {
        console.log('Respuesta de pacientes:', response);
        this.allPatients = Array.isArray(response)
          ? response
          : response?.data || [];
        console.log(`Cargados ${this.allPatients.length} pacientes`);
      },
      (error) => {
        console.error('Error al cargar pacientes:', error);
      }
    );
  }
  // Navegación del calendario
  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.updateMonthName();
    this.loadCalendarDays();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.updateMonthName();
    this.loadCalendarDays();
  }

  prevDay(): void {
    const prevDay = new Date(this.selectedDay);
    prevDay.setDate(prevDay.getDate() - 1);
    this.selectedDay = prevDay;
    this.updateSelectedDayFormatted();
    this.loadDayAppointments();
  }

  nextDay(): void {
    const nextDay = new Date(this.selectedDay);
    nextDay.setDate(nextDay.getDate() + 1);
    this.selectedDay = nextDay;
    this.updateSelectedDayFormatted();
    this.loadDayAppointments();
  }

  updateMonthName(): void {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    this.currentMonthName = months[this.currentMonth];
  }

  updateSelectedDayFormatted(): void {
    const day = this.selectedDay.getDate();
    const month = this.selectedDay.getMonth();
    const year = this.selectedDay.getFullYear();
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const dayNames = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    this.selectedDayFormatted = `${
      dayNames[this.selectedDay.getDay()]
    } ${day} de ${monthNames[month]} de ${year}`;
  }

  setViewMode(mode: 'month' | 'week' | 'day'): void {
    this.viewMode = mode;
    if (mode === 'week') {
      this.loadWeekDays();
    } else if (mode === 'day') {
      this.loadDayAppointments();
    }
  }

  // Carga de datos
  loadCalendarDays(): void {
    this.calendarDays = [];

    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);

    const firstDayOffset = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday

    // Días del mes anterior
    const prevMonthLastDay = new Date(
      this.currentYear,
      this.currentMonth,
      0
    ).getDate();
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(this.currentYear, this.currentMonth - 1, day);
      this.calendarDays.push({
        dayNumber: day,
        isOtherMonth: true,
        isToday: this.isToday(date),
        date: date,
        appointments: this.getAppointmentsForDay(date),
      });
    }

    // Días del mes actual
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.calendarDays.push({
        dayNumber: day,
        isOtherMonth: false,
        isToday: this.isToday(date),
        date: date,
        appointments: this.getAppointmentsForDay(date),
      });
    }

    // Días del siguiente mes para completar la cuadrícula
    const remainingDays = 42 - this.calendarDays.length; // 6 filas x 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      this.calendarDays.push({
        dayNumber: day,
        isOtherMonth: true,
        isToday: this.isToday(date),
        date: date,
        appointments: this.getAppointmentsForDay(date),
      });
    }
  }
  isSameDay(date1: Date, date2: Date): boolean {
    try {
      // Verificar que ambas fechas son objetos Date válidos
      if (!(date1 instanceof Date) || !(date2 instanceof Date) || 
          isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return false;
      }
      
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    } catch (e) {
      console.error('Error en isSameDay:', e);
      return false;
    }
  }
 calculateAppointmentTop(appointment: any): number {
  try {
    // Obtener tiempo de la cita
    const timeStr = appointment.time || appointment.hora;
    if (!timeStr) return 0;
    
    // Extraer horas y minutos
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // La primera hora mostrada en la vista (ajusta esto según tu diseño)
    const firstHour = 7; // Si tu día comienza a las 7:00 AM
    
    // Calcular minutos desde la hora de inicio
    const minutesFromStart = (hours - firstHour) * 60 + parseInt(minutes || '0');
    
    
    return minutesFromStart;
  } catch (e) {
    console.error('Error calculando posición de cita:', e, appointment);
    return 0;
  }
}
  loadHours(): void {
    this.hours = [];
    // Ajusta estos valores según tu horario de trabajo (por ejemplo, 7:00 a 19:00)
    const startHour = 7;
    const endHour = 19;
    
    for (let i = startHour; i <= endHour; i++) {
      this.hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    
    console.log("Horas cargadas:", this.hours);
  }
  calculateAppointmentHeight(appointment: any): number {
    // Obtener duración en minutos (1 minuto = 1 píxel de altura)
    let duration = 60; // Valor predeterminado: 1 hora = 60px
    
    try {
      // Intentar obtener la duración del appointment
      if (appointment.duration) {
        duration = typeof appointment.duration === 'number' 
          ? appointment.duration 
          : parseInt(appointment.duration, 10);
      } else if (appointment.duracion) {
        duration = typeof appointment.duracion === 'number' 
          ? appointment.duracion 
          : parseInt(appointment.duracion, 10);
      } else if (appointment.minutos) {
        duration = typeof appointment.minutos === 'number'
          ? appointment.minutos
          : parseInt(appointment.minutos, 10);
      }
      
      // Validar que sea un número válido
      if (isNaN(duration) || duration <= 0) {
        duration = 60; // Si no es válido, usar 60 min por defecto
      }
      
      console.log(`Altura calculada para cita: ${duration}px`);
      
      return duration; // 1 minuto = 1 píxel
    } catch (e) {
      console.error('Error al calcular altura de cita:', e);
      return 60; // Valor por defecto si hay error
    }
  }
  formatAppointmentTime(appointment: any): string {
    const timeStr = appointment.time || appointment.hora;
    if (!timeStr) return '';
    
    // Obtener la duración con el mismo manejo de diferentes formatos
    let duration = 60; // Valor predeterminado
    
    if (appointment.duration) {
      duration = typeof appointment.duration === 'number' 
        ? appointment.duration 
        : parseInt(appointment.duration, 10);
    } else if (appointment.duracion) {
      duration = typeof appointment.duracion === 'number' 
        ? appointment.duracion 
        : parseInt(appointment.duracion, 10);
    }
    
    // Validar duración
    if (isNaN(duration) || duration <= 0) {
      duration = 30;
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Calcular hora de fin
    let endHour = hours;
    let endMinutes = minutes + duration;
    
    // Ajustar si los minutos superan 60
    if (endMinutes >= 60) {
      endHour += Math.floor(endMinutes / 60);
      endMinutes = endMinutes % 60;
    }
    
    // Formatear como "HH:MM - HH:MM"
    return `${timeStr} - ${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
  loadWeekView(): void {
    const today = new Date();
    
    // Si weekDays no está definido en la clase, inicialízalo
    this.weekDays = [];
    
    // Generar los días de la semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i); // Domingo a Sábado
      
      this.weekDays.push({
        date: date,
        dayName: this.getDayName(date),
        dayNumber: date.getDate(),
        isToday: this.isSameDay(date, today)
      });
    }
    
    // Log para depuración
    console.log('Días de la semana:', this.weekDays);
    console.log('Citas disponibles:', this.appointments.length);
  }
  getDayName(date: Date): string {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dayNames[date.getDay()];
  }
  formatDetailDate(dateStr: string): string {
    if (!dateStr) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Error en formato de fecha';
    }
  }
  
  loadWeekDays(): void {
    try {
      const today = new Date();
      const currentDay = today.getDay(); // 0 (domingo) a 6 (sábado)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDay); // Retrocede al domingo más reciente
  
      this.weekDays = [];
  
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
  
        const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i];
  
        this.weekDays.push({
          dayName: dayName,
          dayNumber: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          isToday: this.isToday(date),
          date: date // Asegurando que date es un objeto Date válido
        });
      }
      
      console.log("WeekDays cargados correctamente:", this.weekDays);
    } catch (e) {
      console.error('Error al cargar días de la semana:', e);
    }
  }

  loadDayAppointments(): void {
    this.dayAppointments = this.getAppointmentsForDay(this.selectedDay);
  }

  // Helpers para citas
  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  getAppointmentsForDay(day: any): any[] {
    if (!this.filteredAppointments) return [];
    
    // Asegurar que tenemos un objeto Date válido para comparar
    let dayDate: Date;
    
    try {
      // Si day es un objeto con una propiedad date
      if (day && day.date instanceof Date) {
        dayDate = day.date;
      }
      // Si day es un objeto con propiedades de fecha separadas
      else if (day && typeof day.year === 'number' && typeof day.month === 'number' && typeof day.dayNumber === 'number') {
        dayDate = new Date(day.year, day.month, day.dayNumber);
      }
      // Si day es directamente una fecha
      else if (day instanceof Date) {
        dayDate = day;
      }
      // Si no podemos obtener una fecha válida, usar la fecha actual
      else {
        console.warn('Formato de día no reconocido:', day);
        return [];
      }
      
      // Verificar que la fecha es válida
      if (isNaN(dayDate.getTime())) {
        console.warn('Fecha inválida:', day);
        return [];
      }
      
      return this.filteredAppointments
        .filter((appointment) => {
          try {
            let appointmentDate;
  
            // SOLUCIÓN: Manejar múltiples formatos de fecha
            if (typeof appointment.date === 'string') {
              // Si incluye T, es formato ISO completo
              if (appointment.date.includes('T')) {
                appointmentDate = new Date(appointment.date);
              } else {
                // Si es 'YYYY-MM-DD'
                const [year, month, day] = appointment.date.split('-').map(Number);
                if (year && month && day) {
                  appointmentDate = new Date(year, month - 1, day);
                } else {
                  appointmentDate = new Date(appointment.date);
                }
              }
            } else if (appointment.fecha && typeof appointment.fecha === 'string') {
              appointmentDate = new Date(appointment.fecha);
            } else {
              appointmentDate = new Date(appointment.date || appointment.fecha);
            }
  
            // Verificar que la fecha sea válida
            if (isNaN(appointmentDate.getTime())) {
              console.warn('Fecha de cita inválida:', appointment.date || appointment.fecha);
              return false;
            }
  
            // Solo comparar año, mes y día
            return (
              dayDate.getFullYear() === appointmentDate.getFullYear() &&
              dayDate.getMonth() === appointmentDate.getMonth() &&
              dayDate.getDate() === appointmentDate.getDate()
            );
          } catch (e) {
            console.error('Error al procesar fecha de cita:', appointment.date || appointment.fecha, e);
            return false;
          }
        })
        .sort((a, b) => {
          return this.timeToMinutes(a.time || a.hora) - this.timeToMinutes(b.time || b.hora);
        });
    } catch (e) {
      console.error('Error al procesar día:', day, e);
      return [];
    }
  }

  getAppointmentsByDay(day: any): any[] {
    return this.filteredAppointments.filter((appointment) => {
      try {
        let appointmentDate;

        // Manejar múltiples formatos de fecha
        if (typeof appointment.date === 'string') {
          if (appointment.date.includes('T')) {
            appointmentDate = new Date(
              appointment.date.split('T')[0] + 'T12:00:00'
            );
          } else {
            const [year, month, day] = appointment.date.split('-').map(Number);
            if (year && month && day) {
              appointmentDate = new Date(year, month - 1, day);
            } else {
              appointmentDate = new Date(appointment.date);
            }
          }
        } else {
          appointmentDate = new Date(appointment.date);
        }

        // Verificar que la fecha sea válida
        if (isNaN(appointmentDate.getTime())) {
          return false;
        }

        return (
          appointmentDate.getDate() === day.dayNumber &&
          appointmentDate.getMonth() === day.month &&
          appointmentDate.getFullYear() === day.year
        );
      } catch (e) {
        return false;
      }
    });
  }
  getAppointmentClass(appointment: any): string {
    if (!appointment) return 'appointment-preview';

    // Base class
    let classes = 'appointment-preview';

    // Add registration status class
    if (appointment.isRegistered === false) {
      classes += ' unregistered';
    }

    // Add status class with higher priority (this gets applied AFTER registration class)
    if (this.isAppointmentCompleted(appointment)) {
      classes += ' status-completed';
    } else if (this.isAppointmentCancelled(appointment)) {
      classes += ' status-cancelled';
    } else {
      classes += ' status-scheduled';
    }

    return classes;
  }

  getAppointmentStyle(appointment: any): any {
    const startTime = this.timeToMinutes(appointment.time);
    const topPosition = ((startTime - 8 * 60) / 60) * 60; // 8am es la hora de inicio, 60px por hora
    const height = appointment.duration ? parseInt(appointment.duration) : 60;

    return {
      top: `${topPosition}px`,
      height: `${height}px`,
    };
  }

  getDayViewAppointmentStyle(appointment: any): any {
    const startTime = this.timeToMinutes(appointment.time);
    const topPosition = ((startTime - 8 * 60) / 60) * 60; // 8am es la hora de inicio, 60px por hora
    const height = appointment.duration ? parseInt(appointment.duration) : 60;

    return {
      top: `${topPosition}px`,
      height: `${height}px`,
      left: '60px', // Para dejar espacio para la columna de horas
      right: '0',
    };
  }

  timeToMinutes(time: string): number {
    if (!time) return 0;
    
    try {
      const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
      return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
    } catch (e) {
      console.error('Error convirtiendo tiempo a minutos:', time, e);
      return 0;
    }
  }
  getAppointmentStatusClass(status: string): string {
    // Unificar la lógica a términos en inglés
    if (status === 'completed' || status?.toLowerCase() === 'confirmada')
      return 'status-completed';
    if (status === 'cancelled' || status?.toLowerCase() === 'cancelada')
      return 'status-cancelled';
    return 'status-scheduled';
  }

  getStatusText(status: string): string {
    // Asegúrate de que traduzca correctamente desde ambos idiomas
    if (status === 'scheduled' || status?.toLowerCase() === 'pendiente')
      return 'Programada';
    if (status === 'completed' || status?.toLowerCase() === 'confirmada')
      return 'Confirmada';
    if (status === 'cancelled' || status?.toLowerCase() === 'cancelada')
      return 'Cancelada';
    return 'Programada'; // Default
  }

  getAppointmentTypeText(type: string): string {
    if (!type) return 'Consulta General';

    switch (type.toLowerCase()) {
      case 'first':
        return 'Primera Vez';
      case 'followup':
        return 'Seguimiento';
      case 'control':
        return 'Control';
      case 'emergency':
        return 'Urgencia';
      case 'consulta':
        return 'Consulta General';
      default:
        return 'Consulta General';
    }
  }

  formatAppointmentDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  }

  // Filtrado de citas
  filterAppointments(): void {
    let filtered = this.appointments;
  
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (appointment) =>
          appointment.patientName?.toLowerCase().includes(searchLower) ||
          (appointment.patientId &&
            appointment.patientId.toLowerCase().includes(searchLower))
      );
    }
  
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((appointment) => {
        // Obtener el estado normalizado del appointment
        const appointmentStatus = (appointment.status || appointment.estado || '').toLowerCase();
        
        // Comparar según el filtro seleccionado
        switch (this.statusFilter) {
          case 'completed':
            return appointmentStatus === 'completed' || 
                   appointmentStatus === 'confirmada' ||
                   appointmentStatus === 'Confirmada';
          case 'cancelled':
            return appointmentStatus === 'cancelled' || 
                   appointmentStatus === 'cancelada' ||
                   appointmentStatus === 'Cancelada';
          case 'scheduled':
            return appointmentStatus === 'scheduled' || 
                   appointmentStatus === 'pendiente' || 
                   appointmentStatus === 'Pendiente' ||
                   (!appointmentStatus || appointmentStatus === ''); // Por defecto si no tiene estado
          default:
            return appointment.status === this.statusFilter;
        }
      });
    }
  
    if (this.typeFilter !== 'all') {
      if (this.typeFilter === 'registered') {
        filtered = filtered.filter((appointment) => appointment.isRegistered);
      } else if (this.typeFilter === 'unregistered') {
        filtered = filtered.filter((appointment) => !appointment.isRegistered);
      }
    }
  
    this.filteredAppointments = filtered;
    this.loadCalendarDays();
    if (this.viewMode === 'week') {
      this.loadWeekDays();
    } else if (this.viewMode === 'day') {
      this.loadDayAppointments();
    }
  }

  // Modal de nueva cita
  openNewAppointmentModal(): void {
    this.resetAppointmentForm();
    this.showNewAppointmentModal = true;
  }

  closeNewAppointmentModal(): void {
    this.showNewAppointmentModal = false;
  }

  resetAppointmentForm(): void {
    this.appointmentForm.reset({
      appointmentType: 'first',
      duration: '60',
      date: this.formatDateForInput(new Date()),
      time: '09:00',
    });
    this.selectedPatient = null;
    this.patientType = 'registered';
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setPatientType(type: 'registered' | 'unregistered'): void {
    this.patientType = type;

    if (type === 'registered') {
      this.appointmentForm.get('unregisteredName')?.clearValidators();
      this.appointmentForm.get('unregisteredLastName')?.clearValidators();
    } else {
      this.appointmentForm
        .get('unregisteredName')
        ?.setValidators([Validators.required]);
      this.appointmentForm
        .get('unregisteredLastName')
        ?.setValidators([Validators.required]);
    }

    this.appointmentForm.get('unregisteredName')?.updateValueAndValidity();
    this.appointmentForm.get('unregisteredLastName')?.updateValueAndValidity();
  }

  searchPatients(): void {
    const searchTerm = this.appointmentForm
      .get('patientSearch')
      ?.value?.toLowerCase();
    if (!searchTerm || searchTerm.length < 2) {
      this.searchResults = [];
      return;
    }

    // Corregido: utiliza apellidos (plural)
    this.searchResults = this.allPatients
      .filter((patient) => {
        // Intentar construir nombre completo usando diferentes combinaciones de campos
        let fullName = '';

        if (patient.nombre && patient.apellidos) {
          fullName = `${patient.nombre} ${patient.apellidos}`.toLowerCase();
        } else if (patient.nombre && patient.apellido) {
          fullName = `${patient.nombre} ${patient.apellido}`.toLowerCase();
        } else if (patient.patientName) {
          fullName = patient.patientName.toLowerCase();
        } else {
          fullName = patient.nombre?.toLowerCase() || '';
        }

        const document = patient.numero_documento?.toLowerCase() || '';

        return fullName.includes(searchTerm) || document.includes(searchTerm);
      })
      .slice(0, 10);
  }

  selectPatient(patient: any): void {
    this.selectedPatient = patient;
    this.searchResults = [];
    this.appointmentForm.get('patientSearch')?.setValue('');
  }

  clearSelectedPatient(): void {
    this.selectedPatient = null;
  }
  onPatientDropdownChange(event: any): void {
    const selectedDocumentId = event.target.value;
    if (!selectedDocumentId) {
      return; // No se seleccionó ningún paciente
    }

    const selectedPatient = this.allPatients.find(
      (p) => p.numero_documento === selectedDocumentId
    );
    if (selectedPatient) {
      this.selectPatient(selectedPatient);
      event.target.value = '';
    }
  }
  normalizeAppointments(): void {
    this.appointments = this.appointments.map((appointment) => {
      // Crear una copia para no mutar el objeto original
      const normalized = { ...appointment };

      // Normalizar el estado
      if (normalized.estado && !normalized.status) {
        if (normalized.estado.toLowerCase() === 'confirmada')
          normalized.status = 'completed';
        else if (normalized.estado.toLowerCase() === 'cancelada')
          normalized.status = 'cancelled';
        else normalized.status = 'scheduled';
      }

      // Normalizar duración
      if (!normalized.duration) {
        normalized.duration = normalized.duracion || normalized.minutos || '30';
      }

      // Si no hay patientName pero tenemos las partes, construirlo
      if (!normalized.patientName) {
        if (normalized.nombre && normalized.apellidos) {
          normalized.patientName = `${normalized.nombre} ${normalized.apellidos}`;
        } else if (normalized.nombre && normalized.apellido) {
          normalized.patientName = `${normalized.nombre} ${normalized.apellido}`;
        } else if (
          normalized.nombre_paciente &&
          normalized.apellidos_paciente
        ) {
          normalized.patientName = `${normalized.nombre_paciente} ${normalized.apellidos_paciente}`;
        } else if (normalized.nombre) {
          normalized.patientName = normalized.nombre;
        }
      }

      // patientName ya existe, asegúrate de que permanece

      // Asegurar que isRegistered sea booleano
      if (normalized.isRegistered === undefined) {
        normalized.isRegistered = true;
      }

      return normalized;
    });

    this.filteredAppointments = [...this.appointments];
  }
  formatDuration(duration: string | number): string {
    if (!duration) return 'No especificada';

    const mins = Number(duration);
    if (isNaN(mins)) return duration + ' minutos';

    if (mins < 60) {
      return mins + ' minutos';
    } else {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (remainingMins === 0) {
        return hours + (hours === 1 ? ' hora' : ' horas');
      } else {
        return (
          hours +
          (hours === 1 ? ' hora ' : ' horas ') +
          remainingMins +
          ' minutos'
        );
      }
    }
  }
  saveAppointment(): void {
    if (this.appointmentForm.invalid) {
      console.error('Formulario inválido:', this.appointmentForm.errors);
      return;
    }

    if (this.patientType === 'registered' && !this.selectedPatient) {
      this.notificacionService.warning('Por favor seleccione un paciente');
      return;
    }

    this.saving = true;

    // Si es paciente registrado (mantener código existente)
    if (this.patientType === 'registered') {
      const appointmentData: any = {
        correo: localStorage.getItem('correo'),
        fecha_cita: this.appointmentForm.get('date')?.value,
        hora_cita: this.appointmentForm.get('time')?.value,
        estado: 'Pendiente',
        descripcion: this.appointmentForm.get('notes')?.value || '',
        duracion: this.appointmentForm.get('duration')?.value || '30',
      };

      appointmentData.numero_documento = this.selectedPatient.numero_documento;

      this.agendaService.createRegisteredAppointment(appointmentData).subscribe(
        (response) => {
          console.log('Respuesta de creación de cita:', response);
          this.saving = false;

          if (response.error) {
            this.notificacionService.error(`Error: ${response.message}`);
            return;
          }

          // Éxito
          this.notificacionService.success('Cita creada correctamente');
          this.closeNewAppointmentModal();
          this.loadAppointments();
        },
        (error) => {
          console.error('Error creando cita:', error);
          this.notificacionService.error(
            'Error al crear la cita: ' +
              (error.error?.message || error.message || 'Error desconocido')
          );
          this.saving = false;
        }
      );
    } else {
      // Para pacientes NO registrados - NUEVA IMPLEMENTACIÓN
      const nombre = this.appointmentForm.get('unregisteredName')?.value;
      const apellidos = this.appointmentForm.get('unregisteredLastName')?.value;
      const telefono = this.appointmentForm.get('unregisteredPhone')?.value;

      // Validar datos obligatorios
      if (!nombre || !apellidos) {
        this.notificacionService.warning(
          'Debe ingresar nombre y apellido del paciente'
        );
        this.saving = false;
        return;
      }

      if (!telefono || telefono.length < 7) {
        this.notificacionService.warning(
          'Debe ingresar un número de teléfono válido (mínimo 7 dígitos)'
        );
        this.saving = false;
        return;
      }

      // Crear objeto de datos para enviar al backend
      const appointmentData = {
        nombre: nombre,
        apellidos: apellidos,
        correo: localStorage.getItem('correo'),
        fecha_cita: this.appointmentForm.get('date')?.value,
        hora_cita: this.appointmentForm.get('time')?.value,
        telefono: telefono,
        estado: 'Pendiente',
      };

      console.log(
        'Enviando cita para paciente NO registrado:',
        appointmentData
      );

      // Llamar al servicio existente
      this.agendaService
        .createUnregisteredAppointment(appointmentData)
        .subscribe(
          (response) => {
            console.log(
              'Respuesta de creación de cita no registrada:',
              response
            );
            this.saving = false;

            if (response.error) {
              this.notificacionService.error(`Error: ${response.message}`);
              return;
            }

            // Éxito
            this.notificacionService.success(
              'Cita para paciente no registrado creada correctamente'
            );
            this.closeNewAppointmentModal();
            this.loadAppointments();
          },
          (error) => {
            console.error(
              'Error creando cita para paciente no registrado:',
              error
            );
            this.notificacionService.error(
              'Error al crear la cita: ' +
                (error.error?.message || error.message || 'Error desconocido')
            );
            this.saving = false;
          }
        );
    }
  }

  // Modal de detalles de cita
  openAppointmentDetails(appointment: any): void {
    this.selectedAppointment = appointment;
    this.showAppointmentDetailsModal = true;
  }

  closeAppointmentDetailsModal(): void {
    this.showAppointmentDetailsModal = false;
    this.selectedAppointment = null;
  }

  // Acciones sobre citas
  editAppointment(appointment: any): void {
    // Implementar edición de cita
    this.closeAppointmentDetailsModal();
    alert('Funcionalidad de edición en desarrollo');
  }

  completeAppointment(appointment: any): void {
    if (confirm('¿Está seguro de marcar esta cita como Confirmada?')) {
      // Pasar isRegistered como tercer parámetro
      this.agendaService
        .updateAppointmentStatus(
          appointment.id.toString(),
          'Confirmada', // Cambiar 'completed' a 'Confirmada' (lo que espera el backend)
          appointment.isRegistered !== false // Por defecto true, para pacientes registrados
        )
        .subscribe(
          (response: any) => {
            this.notificacionService.success(
              `La cita de ${this.getPatientFullName(
                appointment
              )} ha sido  correctamente`
            );
            this.loadAppointments();
            this.closeAppointmentDetailsModal();
          },
          (error: any) => {
            console.error('Error al actualizar estado de cita:', error);
            this.notificacionService.error(
              'Ocurrió un error al actualizar el estado de la cita'
            );
          }
        );
    }
  }
  cancelAppointment(appointment: any): void {
    if (confirm('¿Está seguro de cancelar esta cita?')) {
      this.agendaService
        .updateAppointmentStatus(
          appointment.id.toString(),
          'Cancelada', // Cambiar 'cancelled' a 'Cancelada'
          appointment.isRegistered !== false
        )
        .subscribe(
          (response: any) => {
            console.log('Cita cancelada:', response);

            // Mostrar notificación de éxito con el servicio existente
            this.notificacionService.success(
              `La cita de ${this.getPatientFullName(
                appointment
              )} ha sido cancelada correctamente`
            );

            this.loadAppointments();
            this.closeAppointmentDetailsModal();
          },
          (error: any) => {
            console.error('Error al cancelar cita:', error);
            this.notificacionService.error(
              'Ocurrió un error al cancelar la cita'
            );
          }
        );
    }
  }

  deleteAppointment(appointment: any): void {
    if (
      confirm(
        '¿Está seguro de eliminar esta cita? Esta acción no se puede deshacer.'
      )
    ) {
      this.agendaService
        .deleteAppointment(
          appointment.id.toString(),
          appointment.isRegistered !== false
        )
        .subscribe(
          (response: any) => {
            console.log('Cita eliminada:', response);

            // Notificación de éxito
            this.notificacionService.success(
              `La cita de ${this.getPatientFullName(
                appointment
              )} ha sido eliminada correctamente`
            );

            this.loadAppointments();
            this.closeAppointmentDetailsModal();
          },
          (error: any) => {
            console.error('Error al eliminar cita:', error);
            this.notificacionService.error(
              'Ocurrió un error al eliminar la cita'
            );
          }
        );
    }
  }
  isAppointmentCompleted(appointment: any): boolean {
    if (!appointment) return false;

    // Normalize all possible status values
    const status = (
      appointment.status ||
      appointment.estado ||
      ''
    ).toLowerCase();

    return (
      status === 'completed' ||
      status === 'confirmada' ||
      status === 'Confirmada'
    );
  }

  // Unified method to check if appointment is cancelled
  isAppointmentCancelled(appointment: any): boolean {
    if (!appointment) return false;

    // Normalize all possible status values
    const status = (
      appointment.status ||
      appointment.estado ||
      ''
    ).toLowerCase();

    return (
      status === 'cancelled' || status === 'cancelada' || status === 'cancelado'
    );
  }
  viewAllDayAppointments(day: any): void {
    this.selectedDay = day.date;
    this.updateSelectedDayFormatted();
    this.setViewMode('day');
  }
  extractNameParts(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) return { firstName: '', lastName: '' };

    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    // Consideramos que el último espacio separa el apellido
    const firstName = parts.slice(0, -1).join(' ');
    const lastName = parts[parts.length - 1];

    return { firstName, lastName };
  }
  // Carga inicial de citas
  loadAppointments(): void {
    this.agendaService.getAllAppointments().subscribe(
      (appointments: any) => {
        this.appointments = appointments;

        // Aplicar normalización de datos para asegurar formato correcto
        this.normalizeAppointments();

        this.filteredAppointments = [...this.appointments];
        this.loadCalendarDays();
        if (this.viewMode === 'week') {
          this.loadWeekDays();
        } else if (this.viewMode === 'day') {
          this.loadDayAppointments();
        }

        // Para depuración
        console.log('Primera cita normalizada:', this.appointments[0]);
      },
      (error: any) => {
        console.error('Error al cargar citas:', error);
        this.notificacionService.error('Ocurrió un error al cargar las citas');
      }
    );
  }
  // Añade estos métodos a tu clase
  getPatientFullName(appointment: any): string {
    try {
      if (!appointment) return "Sin paciente";
      
      // Caso 1: Si hay un objeto patient con datos
      if (appointment.patient && typeof appointment.patient === 'object') {
        const nombre = appointment.patient.nombre || '';
        const apellidos = appointment.patient.apellidos ;
        return `${nombre} ${apellidos}`.trim();
      } 
      // Caso 2: Si ya existe un patientName completo
      else if (appointment.patientName) {
        return appointment.patientName;
      }
      // Caso 3: Si nombre y apellidos están directamente en el objeto
      else if (appointment.nombre || appointment.apellidos) {
        const nombre = appointment.nombre || '';
        const apellidos = appointment.apellidos || appointment.apellido || '';
        return `${nombre} ${apellidos}`.trim();
      } 
      // Caso 4: Si hay firstName y lastName en formato diferente
      else if (appointment.firstName || appointment.lastName) {
        return `${appointment.firstName || ''} ${appointment.lastName || ''}`.trim();
      }
      // Caso 5: Para pacientes con formatos especiales
      else if (appointment.nombre_paciente || appointment.apellidos_paciente) {
        return `${appointment.nombre_paciente || ''} ${appointment.apellidos_paciente || ''}`.trim();
      } 
      
      return "Paciente sin nombre";
    } catch (e) {
      console.error("Error al obtener nombre:", e);
      return "Error al obtener nombre";
    }
  }
  filterAppointmentsByState(state: string): void {
    if (!state || state === 'all') {
      this.filteredAppointments = [...this.appointments];
      return;
    }
    
    // Normalizar nombres de estado para comparación
    const normalizedState = state.toLowerCase().trim();
    
    this.filteredAppointments = this.appointments.filter(appointment => {
      // Extraer el estado con manejo de diferentes formatos
      const appointmentState = (
        appointment.estado || 
        appointment.status || 
        ''
      ).toLowerCase().trim();
      
      // Manejar posibles variaciones de nombres de estado
      if (normalizedState === 'programada' || normalizedState === 'scheduled') {
        return appointmentState === 'programada' || 
               appointmentState === 'scheduled' || 
               appointmentState === 'pendiente' || 
               appointmentState === 'pending';
      }
      else if (normalizedState === 'completada' || normalizedState === 'completed') {
        return appointmentState === 'completada' || 
               appointmentState === 'completed' || 
               appointmentState === 'finalizada' || 
               appointmentState === 'finished';
      }
      else if (normalizedState === 'cancelada' || normalizedState === 'cancelled') {
        return appointmentState === 'cancelada' || 
               appointmentState === 'cancelled';
      }
      
      // Comparación directa como fallback
      return appointmentState === normalizedState;
    });
    
    // Log para depuración
    console.log(`Filtrado por estado: ${state}. Citas encontradas: ${this.filteredAppointments.length}`);
    
    // Actualizar vista
    this.refreshView();
  }
  refreshView(): void {
    // Actualizar la vista actual según el modo seleccionado
    this.loadCalendarDays();
    
    if (this.viewMode === 'week') {
      this.loadWeekDays();
    } else if (this.viewMode === 'day') {
      this.loadDayAppointments();
    }
    
    // Opcional: Forzar actualización de la vista
    // Si estás usando ChangeDetectorRef puedes descomentar la siguiente línea
    // this.cdr.detectChanges();
  }
  getDuration(appointment: any): string {
    if (!appointment) return '60'; // Valor predeterminado
    
    let duration: any = appointment.duration || appointment.duracion || 30;
    
    // Convertir a número si es string
    if (typeof duration === 'string') {
      duration = parseInt(duration, 10);
      if (isNaN(duration) || duration <= 0) {
        duration = 60;
      }
    }
    
    return duration.toString();
  }
  isCitaConfirmada(appointment: any): boolean {
    if (!appointment) return false;

    // Verifica todas las posibilidades
    return (
      appointment.status === 'completed' ||
      appointment.estado === 'Confirmada' ||
      appointment.estado?.toLowerCase() === 'confirmada' ||
      appointment.estado?.toLowerCase() === 'completed'
    );
  }

  isCitaCancelada(appointment: any): boolean {
    if (!appointment) return false;

    // Verifica todas las posibilidades
    return (
      appointment.status === 'cancelled' ||
      appointment.estado === 'Cancelada' ||
      appointment.estado?.toLowerCase() === 'cancelada' ||
      appointment.estado?.toLowerCase() === 'cancelled'
    );
  }
}
