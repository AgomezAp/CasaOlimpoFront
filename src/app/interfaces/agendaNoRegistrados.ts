export interface AgendaNoRegistrados {
  ANRid: number;
  nombre: string;
  apellidos: string;
  fecha_cita: Date;
  hora_cita: string;
  telefono: string;
  estado: 'Confirmada' | 'Cancelada' | 'Pendiente';
  correo: string;
  duracion : number;
}
