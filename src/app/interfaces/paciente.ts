export interface Paciente {
     Pid : number;
     nombre : string;
     apellidos : string;
     fecha_nacimiento : Date;
     sexo : 'Masculino' | 'Femenino' | 'Otro';
     ciudad_nacimiento : string;
     edad : string;
     tipo_documento : 'Cedula' | 'Tarjeta de identidad' | 'Cedula de extranjeria' | 'Pasaporte';
     numero_documento : string;
     ciudad_expedicion : string;
     ciudad_domicilio : string;
     barrio : string;
     direccion_domicilio : string;
     telefono : string;
     email : string;
     celular : string;
     ocupacion : string;
     estado_civil : 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo';
     eps : string;
     tipo_afiliacion : 'Contributivo' | 'Subsidiado' | 'Vinculado' | 'Particular';
     grupo_sanguineo : 'A' | 'A' | 'B' | 'B' | 'AB' | 'AB' | 'O' | 'O';
     rh : '+' | '-';
     alergias : string;
     antecedentes : string;
     antecedentes_familiares : string;
     foto_path: string;
}