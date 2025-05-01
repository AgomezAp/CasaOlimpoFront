import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { NotificacionService } from '../../../services/notificacion.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule, FormsModule, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  usuarios: any[] = [];
  cargando: boolean = false;
  usuariosPaginados: any[] = [];

  paginaActual: number = 1;
  pageSize: number = 5; // Cambiado de tamañoPagina a pageSize
  totalPaginas: number = 1;

  mostrarModal: boolean = false;
  usuarioSeleccionado: any = null;
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';
  mensajeError: string = '';

  mensajeCarga: string = '';
  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }
  mostrarCargando(mensaje: string = 'Cargando...') {
    this.mensajeCarga = mensaje;
    this.cargando = true;
  }

  ocultarCargando() {
    this.cargando = false;
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (response) => {
        this.usuarios = (response.data || []).map((usuario: any) => ({
          ...usuario,
          activo: usuario.activo !== undefined ? usuario.activo : true, 
        }));
        console.log('Usuarios con estado añadido:', this.usuarios);
        this.calcularPaginacion();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.notificacionService.error('No se pudieron cargar los usuarios');
        this.cargando = false;
      },
    });
  }

  navegarACrearUsuario(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.usuarios.length / this.pageSize);
    this.cambiarPagina(1);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
    const inicio = (pagina - 1) * this.pageSize;
    const fin = inicio + this.pageSize;
    this.usuariosPaginados = this.usuarios.slice(inicio, fin);
  }

  paginaAnterior(): void {
    this.cambiarPagina(this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    this.cambiarPagina(this.paginaActual + 1);
  }

  generarRangoPaginas(): number[] {
    const rango = [];
    const totalBotones = Math.min(5, this.totalPaginas);

    let inicio = Math.max(1, this.paginaActual - Math.floor(totalBotones / 2));
    let fin = inicio + totalBotones - 1;

    if (fin > this.totalPaginas) {
      fin = this.totalPaginas;
      inicio = Math.max(1, fin - totalBotones + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      rango.push(i);
    }

    return rango;
  }

  getRolClass(rol: string): string {
    switch (rol.toLowerCase()) {
      case 'doctor':
        return 'badge-doctor';
      case 'admin':
        return 'badge-admin';
      default:
        return '';
    }
  }

  getStatusClass(activo: boolean): string {
    return activo ? 'status-active' : 'status-inactive';
  }

  editarUsuario(usuario: any): void {
    this.router.navigate(['/admin/usuarios'], { state: { usuario } });
  }

  resetPassword(usuario: any): void {
    this.usuarioSeleccionado = usuario;
    this.nuevaContrasena = '';
    this.confirmarContrasena = '';
    this.mensajeError = '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.usuarioSeleccionado = null;
  }
  guardarContrasena(): void {
    // Validar contraseña
    if (!this.nuevaContrasena) {
      this.mensajeError = 'La contraseña es requerida';
      return;
    }

    if (this.nuevaContrasena.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.mensajeError = 'Las contraseñas no coinciden';
      return;
    }

    this.mostrarCargando('Restableciendo contraseña...');

    this.usuarioService
      .reestablecerContraseña({
        correo: this.usuarioSeleccionado.correo,
        contrasena: this.nuevaContrasena,
      })
      .subscribe({
        next: () => {

          this.ocultarCargando();
          this.notificacionService.success(
            'Contraseña restablecida correctamente'
          );
          this.cerrarModal();
        },
        error: (error) => {

          this.ocultarCargando();

          let mensajeError = 'No se pudo restablecer la contraseña';

          if (error.error?.msg) {
            mensajeError += ': ' + error.error.msg;
          } else if (error.status === 0) {
            mensajeError += ': No hay conexión con el servidor';
          } else if (error.status) {
            mensajeError += `: Error ${error.status}`;
          }

          this.mensajeError = mensajeError;
          this.notificacionService.error(mensajeError);
        },
      });
  }
  navegarATransferencia(): void {
    this.router.navigate(['/admin/transferencia']);
    console.log('Navegando a transferencia de pacientes');
  }
  eliminarUsuario(usuario: any): void {

    if (!usuario.Uid) {
      console.error('Error: Uid de usuario no definido', usuario);
      this.notificacionService.error(
        'No se puede eliminar: ID de usuario no definido'
      );
      return;
    }

    if (confirm(`¿Está seguro de eliminar al usuario ${usuario.nombre}?`)) {
      this.mostrarCargando('Eliminando usuario...');
      this.usuarioService.eliminarUsuario(usuario.Uid).subscribe({
        next: () => {
          this.ocultarCargando();
          this.notificacionService.success('Usuario eliminado correctamente');
          this.cargarUsuarios();
        },
        error: (error) => {
          this.ocultarCargando();
          console.error('Error al eliminar usuario:', error);

          let mensajeError = 'No se pudo eliminar el usuario';
          if (error.error?.msg) {
            mensajeError += ': ' + error.error.msg;
          } else if (error.status === 0) {
            mensajeError += ': No hay conexión con el servidor';
          } else if (error.status) {
            mensajeError += `: Error ${error.status}`;
          } else {
            mensajeError += ': Error desconocido';
          }

          this.notificacionService.error(mensajeError);
        },
      });
    }
  }
  generarContrasenaAleatoria(): string {
    const caracteres =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < 8; i++) {
      resultado += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }
    return resultado;
  }
  toggleEstadoUsuario(usuario: any): void {
    const nuevoEstado = !usuario.activo;
    const mensaje = nuevoEstado
      ? `¿Está seguro de activar al usuario ${usuario.nombre}?`
      : `¿Está seguro de desactivar al usuario ${usuario.nombre}?`;

    if (confirm(mensaje)) {
      // Implementación para cambiar el estado del usuario
      this.notificacionService.info('Función en desarrollo');
    }
  }
}
