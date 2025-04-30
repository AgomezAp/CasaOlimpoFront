export interface Receta {
     RecetaId?: number;
     Uid?: number;
     numero_documento: string;
     medicamentos: string;
     instrucciones: string;
     duracion_tratamiento?: string;
     diagnostico: string;
     observaciones?: string;
     anotaciones?: string;
     fecha_emision: Date | string;
     estado?: "ACTIVA" | "COMPLETADA" | "CADUCADA";
     editada?: boolean;
     doctor?: {
       nombre: string;
       apellido: string;
       rol?: string;
     };
     consulta?: any;
     fecha_creacion?: string | Date;
     completada: boolean;
   }