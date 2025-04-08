import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgendaService } from '../../../services/agenda.service';
import { PacienteService } from '../../../services/paciente.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agenda-agregar',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './agenda-agregar.component.html',
  styleUrl: './agenda-agregar.component.css'
})
export class AgendaAgregarComponent implements OnInit {
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
  
  // Variables para filtrado
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  
  // Variables para hora
  hours: number[] = Array.from({ length: 12 }, (_, i) => i + 8); // 8am a 7pm
  
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
    private patientService: PacienteService
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
      notes: ['']
    });
  }
  
  ngOnInit(): void {
    this.updateMonthName();
    this.loadCalendarDays();
    this.loadWeekDays();
    this.updateSelectedDayFormatted();
    this.loadAppointments();
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
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.currentMonthName = months[this.currentMonth];
  }
  
  updateSelectedDayFormatted(): void {
    const day = this.selectedDay.getDate();
    const month = this.selectedDay.getMonth();
    const year = this.selectedDay.getFullYear();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    this.selectedDayFormatted = `${dayNames[this.selectedDay.getDay()]} ${day} de ${monthNames[month]} de ${year}`;
  }
  
setViewMode(mode: 'month' | 'week' | 'day'): void {
  this.viewMode = mode;
  
  if (mode === 'month') {
    this.loadCalendarDays();
  } else if (mode === 'week') {
    this.loadWeekDays();
  } else {
    this.loadDayAppointments();
  }
}
  
  // Carga de datos
  loadCalendarDays(): void {
    this.calendarDays = [];
    
    // Obtener el primer día del mes actual
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    // Obtener el día de la semana del primer día (0 = domingo, 6 = sábado)
    const firstDayOfWeek = firstDay.getDay();
    
    // Agregar días del mes anterior para completar la primera semana
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(this.currentYear, this.currentMonth - 1, day);
      
      this.calendarDays.push({
        dayNumber: day,
        isOtherMonth: true,
        isToday: this.isToday(date),
        date: date,
        appointments: this.getAppointmentsForDay(date) // Asignar citas para este día
      });
    }
    
    // Agregar días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      
      this.calendarDays.push({
        dayNumber: day,
        isOtherMonth: false,
        isToday: this.isToday(date),
        date: date,
        appointments: this.getAppointmentsForDay(date) // Asignar citas para este día
      });
    }
    
    // Agregar días del mes siguiente para completar la última semana
    const daysToAdd = 42 - this.calendarDays.length; // 6 filas x 7 días = 42 celdas
    
    for (let day = 1; day <= daysToAdd; day++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      
      this.calendarDays.push({
        dayNumber: day,
        isOtherMonth: true,
        isToday: this.isToday(date),
        date: date,
        appointments: this.getAppointmentsForDay(date) // Asignar citas para este día
      });
    }
    
    console.log('Calendario cargado:', this.calendarDays);
  }
  
  
  loadWeekDays(): void {
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
        date: date
      });
    }
  }
  
  loadDayAppointments(): void {
    this.dayAppointments = this.getAppointmentsForDay(this.selectedDay);
  }
  
  // Helpers para citas
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  getAppointmentsForDay(date: Date): any[] {
    if (!this.filteredAppointments || !Array.isArray(this.filteredAppointments)) {
      console.log('No hay citas o no es un array:', this.filteredAppointments);
      return [];
    }
    
    return this.filteredAppointments.filter(appointment => {
      // Asegúrate de que appointment.date sea un objeto Date o se pueda convertir a uno
      if (!appointment || !appointment.date) {
        console.log('Cita sin fecha:', appointment);
        return false;
      }
      
      let appointmentDate;
      
      // Si la fecha es un string, convertirla a Date
      if (typeof appointment.date === 'string') {
        appointmentDate = new Date(appointment.date);
      } else {
        appointmentDate = new Date(appointment.date);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(appointmentDate.getTime())) {
        console.log('Fecha inválida para cita:', appointment);
        return false;
      }
      
      // Comparar solo la fecha (sin la hora)
      return appointmentDate.getDate() === date.getDate() &&
             appointmentDate.getMonth() === date.getMonth() &&
             appointmentDate.getFullYear() === date.getFullYear();
    });
  }
  
  getAppointmentsByDay(day: any): any[] {
    return this.filteredAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.getDate() === day.dayNumber &&
             appointmentDate.getMonth() === day.month &&
             appointmentDate.getFullYear() === day.year;
    });
  }
  
  getAppointmentClass(appointment: any): string {
    let classes = '';
    
    if (appointment.status) {
      classes += ` status-${appointment.status}`;
    }
    
    if (!appointment.isRegistered) {
      classes += ' unregistered';
    }
    
    return classes;
  }
  
  getAppointmentStyle(appointment: any): any {
    const startTime = this.timeToMinutes(appointment.time);
    const topPosition = (startTime - 8 * 60) / 60 * 60; // 8am es la hora de inicio, 60px por hora
    const height = appointment.duration ? parseInt(appointment.duration) : 60;
    
    return {
      top: `${topPosition}px`,
      height: `${height}px`,
    };
  }
  
  getDayViewAppointmentStyle(appointment: any): any {
    const startTime = this.timeToMinutes(appointment.time);
    const topPosition = (startTime - 8 * 60) / 60 * 60; // 8am es la hora de inicio, 60px por hora
    const height = appointment.duration ? parseInt(appointment.duration) : 60;
    
    return {
      top: `${topPosition}px`,
      height: `${height}px`,
      left: '60px', // Para dejar espacio para la columna de horas
      right: '0',
    };
  }
  
  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  getAppointmentStatusClass(status: string): string {
    return `status-${status}`;
  }
  
  getStatusText(status: string): string {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  }
  
  getAppointmentTypeText(type: string): string {
    switch (type) {
      case 'first': return 'Primera Vez';
      case 'followup': return 'Seguimiento';
      case 'control': return 'Control';
      case 'emergency': return 'Urgencia';
      default: return 'Consulta General';
    }
  }
  
  formatAppointmentDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }
  
  // Filtrado de citas
  filterAppointments(): void {
    let filtered = this.appointments;
    
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchLower) ||
        (appointment.patientId && appointment.patientId.toLowerCase().includes(searchLower))
      );
    }
    
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === this.statusFilter);
    }
    
    if (this.typeFilter !== 'all') {
      if (this.typeFilter === 'registered') {
        filtered = filtered.filter(appointment => appointment.isRegistered);
      } else if (this.typeFilter === 'unregistered') {
        filtered = filtered.filter(appointment => !appointment.isRegistered);
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
      time: '09:00'
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
      this.appointmentForm.get('unregisteredName')?.setValidators([Validators.required]);
      this.appointmentForm.get('unregisteredLastName')?.setValidators([Validators.required]);
    }
    
    this.appointmentForm.get('unregisteredName')?.updateValueAndValidity();
    this.appointmentForm.get('unregisteredLastName')?.updateValueAndValidity();
  }
  
  searchPatients(): void {
    const searchTerm = this.appointmentForm.get('patientSearch')?.value;
    if (searchTerm && searchTerm.length > 2) {
      this.patientService.obtenerPacientes().subscribe(
        (results:any) => {
          this.searchResults = results;
        },
        (error:any) => {
          console.error('Error searching patients:', error);
          this.searchResults = [];
        }
      );
    } else {
      this.searchResults = [];
    }
  }
  
  selectPatient(patient: any): void {
    this.selectedPatient = patient;
    this.searchResults = [];
    this.appointmentForm.get('patientSearch')?.setValue('');
  }
  
  clearSelectedPatient(): void {
    this.selectedPatient = null;
  }
  
  saveAppointment(): void {
    if (this.appointmentForm.invalid) {
      // Marcar todos los campos como tocados para mostrar validaciones
      Object.keys(this.appointmentForm.controls).forEach(key => {
        this.appointmentForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    if (this.patientType === 'registered' && !this.selectedPatient) {
      alert('Por favor seleccione un paciente registrado');
      return;
    }
    
    this.saving = true;
    
    const appointmentData = {
      ...this.appointmentForm.value,
      patientId: this.patientType === 'registered' ? this.selectedPatient.numero_documento : null,
      patientName: this.patientType === 'registered' 
        ? `${this.selectedPatient.nombre} ${this.selectedPatient.apellido}`
        : `${this.appointmentForm.get('unregisteredName')?.value} ${this.appointmentForm.get('unregisteredLastName')?.value}`,
      isRegistered: this.patientType === 'registered',
      status: 'scheduled',
      phone: this.patientType === 'registered' ? this.selectedPatient.telefono : this.appointmentForm.get('unregisteredPhone')?.value,
      email: this.patientType === 'registered' ? this.selectedPatient.email : this.appointmentForm.get('unregisteredEmail')?.value
    };
    
    this.agendaService.createAppointment(appointmentData).subscribe(
      (response:any) => {
        this.saving = false;
        this.closeNewAppointmentModal();
        this.loadAppointments();
        alert('Cita agendada correctamente');
      },
      (error:any) => {
        this.saving = false;
        console.error('Error guardando cita:', error);
        alert('Ocurrió un error al agendar la cita');
      }
    );
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
    if (confirm('¿Está seguro de marcar esta cita como completada?')) {
      this.agendaService.updateAppointmentStatus(appointment.id, 'completed').subscribe(
        (response:any) => {
          this.loadAppointments();
          this.closeAppointmentDetailsModal();
        },
        (error:any) => {
          console.error('Error al actualizar estado de cita:', error);
          alert('Ocurrió un error al actualizar el estado de la cita');
        }
      );
    }
  }
  
  cancelAppointment(appointment: any): void {
    if (confirm('¿Está seguro de cancelar esta cita?')) {
      this.agendaService.updateAppointmentStatus(appointment.id, 'cancelled').subscribe(
        (response:any) => {
          this.loadAppointments();
          this.closeAppointmentDetailsModal();
        },
        (error:any) => {
          console.error('Error al cancelar cita:', error);
          alert('Ocurrió un error al cancelar la cita');
        }
      );
    }
  }
  
  deleteAppointment(appointment: any): void {
    if (confirm('¿Está seguro de eliminar esta cita? Esta acción no se puede deshacer.')) {
      this.agendaService.deleteAppointment(appointment.id).subscribe(
        (response:any) => {
          this.loadAppointments();
          this.closeAppointmentDetailsModal();
        },
        (error:any) => {
          console.error('Error al eliminar cita:', error);
          alert('Ocurrió un error al eliminar la cita');
        }
      );
    }
  }
  
  viewAllDayAppointments(day: any): void {
    this.selectedDay = day.date;
    this.updateSelectedDayFormatted();
    this.setViewMode('day');
  }
  
  // Carga inicial de citas
  loadAppointments(): void {
    this.agendaService.getAllAppointments().subscribe(
      (appointments: any[]) => {
        console.log('Citas recibidas:', appointments);
        this.appointments = appointments;
        this.filteredAppointments = appointments;
        
        // Recargar el calendario para reflejar las citas
        this.loadCalendarDays();
        
        // También cargar los datos para otras vistas
        if (this.viewMode === 'week') {
          this.loadWeekDays();
        } else if (this.viewMode === 'day') {
          this.loadDayAppointments();
        }
      },
      (error: any) => {
        console.error('Error al cargar citas:', error);
      }
    );
  }
}