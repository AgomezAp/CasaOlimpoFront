import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AgregarCitasComponent } from './components/paciente/citas/agregar-citas/agregar-citas.component';
import { AgregarPacienteComponent } from './components/paciente/agregar-paciente/agregar-paciente.component';
import { RegistrarComponent } from './components/registrar/registrar.component';
import { RecetaComponent } from './components/paciente/receta/receta.component';
import { AgendaAgregarComponent } from './components/agenda/agenda-agregar/agenda-agregar.component';
import { AgendaDashboardComponent } from './components/agenda/agenda-dashboard/agenda-dashboard.component';
import { CumpleanosComponent } from './components/cumpleanos/cumpleanos.component';
import { CrearDescuentoComponent } from './components/descuento/crear-descuento/crear-descuento.component';
import { DescuentoDashboardComponent } from './components/descuento/descuento-dashboard/descuento-dashboard.component';
import { PacienteDashboardComponent } from './components/paciente/paciente-dashboard/paciente-dashboard.component';
import { FacturaDashboardComponent } from './components/facturacion/factura-dashboard/factura-dashboard.component';
import { GenerarFacturaComponent } from './components/facturacion/generar-factura/generar-factura.component';
import { InfoPacienteComponent } from './components/paciente/info-paciente/info-paciente.component';

export const routes: Routes = [
    {
        path: '',
        component: LoginComponent,
    },
    {
        path: 'Login', component: LoginComponent
    },
    {
        path: 'registrar', component: RegistrarComponent
    },
    {
        path: 'agregar-paciente', component: AgregarPacienteComponent
    },
    {
        path: 'agregar-citas', component: AgregarCitasComponent
    },
    {
        path: 'agregar-citas-agenda', component: AgendaAgregarComponent
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
        path:'info-paciente/:numero_documento',component: InfoPacienteComponent
    }


];
