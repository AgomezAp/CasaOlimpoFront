import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode'
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
  abortController: AbortController | null = null;
  mensajeriaServer: string ='http://localhost:3050/api/whatsapp/'
   
  async verificar(mostrarMensajes: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${this.mensajeriaServer}obtenerClientes`, {
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
        if (mostrarMensajes) {
          this.mensaje = 'Existe una sesión para los mensajes.';
          this.estiloMensaje = 'success';
          setTimeout(() => {
            this.mensaje = '';
            this.estiloMensaje = '';
          }, 10000);
        }
        return true;
      } else {
        if (mostrarMensajes) {
          this.mensaje = 'No se encuentra ninguna sesión activa. Debes activar una lo antes posible';
          this.estiloMensaje = 'warning';
          setTimeout(() => {
            this.mensaje = '';
            this.estiloMensaje = '';
          }, 10000);
        }
        return false;
      }
    } catch (error) {
      console.error('Error de sesion:', error);
      if (mostrarMensajes) {
        this.mensaje = 'Error al obtener la sesión';
        this.estiloMensaje = 'error';
        setTimeout(() => {
          this.mensaje = '';
          this.estiloMensaje = '';
        }, 10000);
      }
      return false;
    }
  }

  

  async eliminar(): Promise<void> {
    const sesionActiva = await this.verificar(false);

    if (!sesionActiva) {
      console.log('No hay sesion activa');
      this.mensaje = 'Sesión actual eliminada. Recuerda crear una nueva lo antes posible.';
      this.estiloMensaje = 'success';
      setTimeout(() => {
        this.mensaje = '';
        this.estiloMensaje = '';
      }, 10000);
      return;
    }

    await fetch(`${this.mensajeriaServer}eliminarClientes`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Origin': '181.129.218.198'
      },
    })
      .then(response => {
        if (response.ok) {
          console.log('Sesion eliminada correctamente');
          this.mensaje = 'Sesión actual eliminada. Recuerda crear una nueva lo antes posible.';
          this.estiloMensaje = 'success';
          setTimeout(() => {
            this.mensaje = '';
            this.estiloMensaje = '';
          }, 10000);
        } else {
          throw new Error('No se pudo eliminar la sesión')
        }
      })
      .then(data => console.log('Eliminar response:', data))
      .catch(error => {
        console.error('Error:', error);
        this.mensaje = 'Ocurrió un error al eliminar la sesión, intentalo de nuevo más tarde.';
        this.estiloMensaje = 'error';
        setTimeout(() => {
          this.mensaje = '';
          this.estiloMensaje = '';
        }, 10000);
      });
  }

  async nuevoSSE(): Promise<void> {
    const sesionActiva = await this.verificar(false);

    if (sesionActiva) {
      console.log('Sesion activa');
      this.mensaje = 'Existe una sesión. Debes eliminarla para crear una nueva.';
      this.estiloMensaje = 'warning';
      setTimeout(() => {
        this.mensaje = '';
        this.estiloMensaje = '';
      }, 10000);
      return;
    }
    const body = JSON.stringify({
      sessionId: "1234"
    })
    this.abortController = new AbortController();
    fetch(`${this.mensajeriaServer}CrearCliente`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': '181.129.218.198'
      },
      body: body,
      mode: 'cors',
      credentials: 'omit',
      signal: this.abortController.signal
    }).then(response => {
      if (!response.body) {
        throw new Error('El servidor no envio un cuerpo');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      const readStream = () => {
        reader.read().then(({ done, value}) => {
          if (done) {
            console.log('Conexion cerrada');
            return;
          }
          const chunk = decoder.decode(value, { stream: true});
          console.log('Datos recibidos:', chunk);

          if (chunk.includes('Código QR generado:')) {
            const qrCodeck = chunk.split('Código QR generado:')[1].trim();
            this.qrCode = qrCodeck;
            console.log('QR actualizado:', this.qrCode)
          }

          if (chunk.includes('Sesión 1234 lista')) {
            console.log('Sesión detectada, cerrando conexion...');
            this.mensaje = 'Sesión detectada exitosamente';
            this.estiloMensaje = 'success';  
            setTimeout(() => {
              this.mensaje = '';
              this.estiloMensaje = '';
            }, 10000);
            this.qrCode = '';
            reader.cancel();
            this.abortController = null;
            return;
          }

          readStream();
        }).catch(error => {
          console.error('Error al leer el flujo:', error);
        });
      };
      readStream();
    }).catch(error => {
      if (error.name === 'AbortError') {
        console.log('Conexion cancelada por el cliente');
      } else {
        console.error('Error en la conexion', error);
        this.mensaje = 'Ocurrió un error al conectar';
      }
    });
  }

  detener(): void {
    if(this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('Conexion detenida')
    }
  }

  ngOnDestroy(): void {
    this.detener();
  }
}
