import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode'
import { interval } from 'rxjs';
@Component({
  selector: 'app-gestion-mensajeria',
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './gestion-mensajeria.component.html',
  styleUrl: './gestion-mensajeria.component.css'
})
export class GestionMensajeriaComponent {
  mensaje: string = '';
  estiloMensaje: string = '';
  qrLeido: boolean = false;
  intervalId: any;
  qrCode: string = '';

  mostrarModal(mensaje: string): void {
    alert(mensaje)
  }
  
  async verificar(): Promise<void> {
    try {
      const response = await fetch('http://localhost:3050/api/whatsapp/obtenerClientes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': '181.129.218.198'
        },
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      console.log(data);

      if (data.clients && data.clients.length > 0) {
        this.mensaje = 'Existe una sesion para los mensajes.';
        this.estiloMensaje = 'success';
      } else {
        this.mensaje = 'No se encuentra ninguna sesion. Debes activarla lo antes posible';
        this.estiloMensaje = 'warning';
      }
    } catch (error) {
      console.error('Error de sesion:', error);
      this.mensaje = 'Error al obtener la sesion';
      this.estiloMensaje = 'error';
    }
  }

  

  async eliminar(): Promise<void> {
    await fetch('http://localhost:3050/api/whatsapp/eliminarClientes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Origin': '181.129.218.198'
      },
    })
      .then(response => {
        if (response.ok) {
          console.log('Sesion eliminada correctamente');
          this.mensaje = 'Sesion actual eliminada, recuerda crear una nueva lo antes posible';
          this.estiloMensaje = 'success';

        } else {
          throw new Error('No se pudo eliminar la sesión')
        }
      })
      .then(data => console.log('Eliminar response:', data))
      .catch(error => {
        console.error('Error:', error);
        this.mensaje = 'Ocurrio un error al eliminar la sesión, intentalo de nuevo mas tarde';
        this.estiloMensaje = 'error';
      });
  }

  actualizarQR(): void {
    this.intervalId  = setInterval(() => {
      if (this.qrLeido) {
        this.qrCode = this.generarNuevoQR();
      } else {
        clearInterval(this.intervalId);
      }
    }, 5000 );
  }

  generarNuevoQR(): string {
    return this.qrCode + Math.random().toString(36).substring(2, 5)
  }

  nuevo(): void {
    fetch('http://localhost:3050/api/whatsapp/CrearCliente', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': '181.129.218.198'
      },
      body: JSON.stringify({
        sessionId: "1234"
      }),
      mode: 'cors',
      credentials: 'omit'
    })
      .then(response => response.json())
      .then(data => {
        this.qrCode = data.qr;
        this.actualizarQR();
        console.log(this.qrCode)
      })
      .catch(error => {
        console.error('Error:', error);
        this.mensaje = 'Ocurrió un error al generar el QR.';
      });
  }
}
