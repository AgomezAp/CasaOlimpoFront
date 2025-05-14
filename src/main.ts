import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { tokenInterceptor } from './app/utils/token.interceptor';
import { provideToastr } from 'ngx-toastr';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts';

bootstrapApplication(AppComponent, {
  ...appConfig, 
  providers: [
    ...appConfig.providers, 
    provideAnimations(), 
    BrowserAnimationsModule,
    FontAwesomeModule,
    provideHttpClient(),  
    provideCharts(withDefaultRegisterables()),  
    provideHttpClient(withInterceptors([tokenInterceptor])),   
    provideToastr({
      timeOut: 1200,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),          // Agrega el proveedor de Toastr
  ]
})
  .catch((err) => console.error(err));
