import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NotificacionService } from './notificacion.service';
@Injectable({
  providedIn: 'root'
})
export class ErrorsService {
  constructor(private toastr: ToastrService, private notificacionService:NotificacionService) { }

  messageError(e: HttpErrorResponse){
    if (e.error.msg) {
      this.notificacionService.error('Error');
    }else{
      this.notificacionService.error("existe un error en el servidor")
    } 
  }
}
