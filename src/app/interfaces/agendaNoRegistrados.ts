export interface AgendaNoRegistrados {
  ANRid: number;
  fecha_cita: Date;
  hora_cita: string;
  telefono: string;
  estado: 'Confirmada' | 'Cancelada' | 'Pendiente';
  correo: string;
}
