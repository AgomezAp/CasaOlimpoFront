export interface Appointment {
    id: number | string;
    patientName: string;
    patientId?: string;
    date: string | Date;
    time: string;
    duration?: number;
    status?: string;
    estado?: string;
    notes?: string;
    isRegistered?: boolean;
    type?: string;
    phone?: string;
  }