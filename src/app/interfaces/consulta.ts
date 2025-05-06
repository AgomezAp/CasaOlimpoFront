export interface Consulta {
     Uid:number;
     Cid: number;
     motivo: string;
     enfermedad_actual: string;
     objetivos_terapia: string;
     historia_problema: string;
     tipo_diagnostico: string;
     plan_tratamiento: string;
     recomendaciones: string;
     numero_documento: string;
     fecha: Date;
     contraindicaciones:string;
     correo: string;
     consentimiento_info : Blob;
     consentimiento_check : boolean;
     abierto : boolean;
}