export interface Facturacion {
    Fid:Number;
    numero_documento:string;
    tipo_pago: 'Efectivo' | 'Tarjeta Débito' | 'Tarjeta Crédito' | 'Transferencia';
    total: number;
}