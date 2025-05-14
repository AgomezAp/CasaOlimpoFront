export interface Consulta {
     Uid:number;
     Cid: number;
     motivo: string;
     enfermedad_actual: string;
     objetivos_terapia: string;
     historia_problema: string;
     desarrollo: string;
     plan_terapeutico: string;
     tipo_diagnostico: string;
     analisis_diagnostico: string;
     plan_tratamiento: string;
     recomendaciones: string;
     numero_documento: string;
     fecha: Date;
     correo: string;
     consentimiento_info : Blob;
     consentimiento_check : boolean;
     abierto : boolean;
}