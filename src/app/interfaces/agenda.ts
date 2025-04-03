export interface Agenda {
  Aid: number;
  correo: string;
  fecha_cita: Date;
  hora_cita: string;
  estado: 'Confirmada' | 'Cancelada' | 'Pendiente';
  numero_documento: string;
  descripcion: string;
} 
