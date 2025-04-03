export interface Receta{
     RecetaId: number;
     Uid: number;
     Cid: number;
     anotaciones: string;
     numero_documento: string;
     medicamentos: string;
     instrucciones: string;
     duracion_tratamiento?: string;
     diagnostico: string;
     observaciones?: string;
     fecha_emision: Date;
     estado: "ACTIVA" | "COMPLETADA" | "CADUCADA";
     editada: boolean;
}