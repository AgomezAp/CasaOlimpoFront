export interface Carpeta {
     CarpetaId: number;
     numero_documento: string;
     imagen_metadata: string; // JSON stringificado con info de las imágenes
     descripcion?: string;
     fecha: Date;
}