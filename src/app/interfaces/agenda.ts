export interface Agenda {
  Aid: number;
  correo: string;
  fecha_cita: Date;
  hora_cita: string;
  estado: 'Confirmada' | 'Cancelada' | 'Pendiente';
  numero_documento: string;
  descripcion: string;
} 

export interface CalendarDay {
  dayNumber: number;
  isOtherMonth: boolean;
  isToday: boolean;
  date: Date;
  appointments: AppointmentDisplay[];
}

export interface AppointmentDisplay {
  id: number | string;
  patientName: string;
  patientId?: string;
  date: string;
  time: string;
  type: string;
  duration?: string;
  notes?: string;
  status: 'Confirmada' | 'Cancelada' | 'Pendiente';
  isRegistered: boolean;
  phone?: string;
  email?: string;
}