import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AgregarPacienteComponent } from './components/paciente/agregar-paciente/agregar-paciente.component';
import { RegistrarComponent } from './components/registrar/registrar.component';
import { RecetaComponent } from './components/paciente/receta/receta.component';
import { AgendaDashboardComponent } from './components/agenda/agenda-dashboard/agenda-dashboard.component';
import { CumpleanosComponent } from './components/cumpleanos/cumpleanos.component';
import { CrearDescuentoComponent } from './components/descuento/crear-descuento/crear-descuento.component';
import { DescuentoDashboardComponent } from './components/descuento/descuento-dashboard/descuento-dashboard.component';
import { PacienteDashboardComponent } from './components/paciente/paciente-dashboard/paciente-dashboard.component';
import { FacturaDashboardComponent } from './components/facturacion/factura-dashboard/factura-dashboard.component';
import { GenerarFacturaComponent } from './components/facturacion/generar-factura/generar-factura.component';
import { InfoPacienteComponent } from './components/paciente/info-paciente/info-paciente.component';
import { HistoriaClinicaComponent } from './components/paciente/historia-clinica/historia-clinica.component';
import { CrearConsultaComponent } from './components/paciente/crear-consulta/crear-consulta.component';
import { EditarDatosComponent } from './components/paciente/editar-datos/editar-datos.component';
import { RedFamiliarComponent } from './components/paciente/red-familiar/red-familiar.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { GestionUsuariosComponent } from './components/admin/gestion-usuarios/gestion-usuarios.component';
import { TransferenciaPacientesComponent } from './components/admin/transferencia-pacientes/transferencia-pacientes.component';
import { FacturaIdComponent } from './components/facturacion/factura-id/factura-id.component';
import { VerdatosconsultaComponent } from './components/paciente/verdatosconsulta/verdatosconsulta.component';
import { CrearConsentimientoComponent } from './components/paciente/crear-consentimiento/crear-consentimiento.component';
import { GestionMensajeriaComponent } from './components/admin/gestion-mensajeria/gestion-mensajeria.component';

export const routes: Routes = [
    {
        path: '',
        component: LoginComponent,
    },
    {
        path: 'registrar', component: RegistrarComponent
    },
    {
        path: 'agregar-paciente', component: AgregarPacienteComponent
    },
    {
        path: 'agenda-dashboard', component: AgendaDashboardComponent
    },
    {
        path: 'cumpleaños', component: CumpleanosComponent
    },
    {
        path: 'descuento', component: CrearDescuentoComponent
    },
    {
        path: 'descuento-dashboard', component: DescuentoDashboardComponent
    },
    {
        path: 'receta', component: RecetaComponent
    },
    {
        path: 'paciente-dashboard', component: PacienteDashboardComponent
    },
    {
        path: 'factura-dashboard', component: FacturaDashboardComponent
    },
    {
        path: 'factura-generar', component: GenerarFacturaComponent
    },
    {
        path: 'facturas', component: FacturaIdComponent
    },
    {
        path:'info-paciente/:numero_documento',component: InfoPacienteComponent
    },
    {
        path:'crear-consulta/:numero_documento',component: CrearConsultaComponent
    },
    {
        path:'paciente/:numero_documento/consulta/:consulta_id/editar',component: EditarDatosComponent
    },
    {
        path: 'paciente/:numero_documento/red-familiar',
        component: RedFamiliarComponent
    },
    {
        path:'paciente/:numero_documento/consulta/:consulta_id',
       component:VerdatosconsultaComponent
    },
    {
        path:'paciente/:numero_documento/consulta/:consulta_id/consentimiento',
        component: CrearConsentimientoComponent
    },
    {
        path: 'admin',
        component: DashboardComponent,
        children: [
          { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
          { path: 'usuarios', component: GestionUsuariosComponent },
          { path: 'transferencia', component: TransferenciaPacientesComponent },
          { path: 'mensajeria', component: GestionMensajeriaComponent}
        ]
      }
    

];
