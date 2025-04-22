import { AfterViewInit, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NotificacionService } from '../../../services/notificacion.service';
import { UsuarioService } from '../../../services/usuario.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.css',
})
export class GestionUsuariosComponent implements OnInit {
  usuarioForm!: FormGroup;
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  searchTerm: string = '';
  cargando: boolean = false;
  modoEdicion: boolean = false;
  usuarioSeleccionado: any = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarUsuarios();
  }

  inicializarFormulario(): void {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['doctor', [Validators.required]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('contrasena')?.value ===
      form.get('confirmarContrasena')?.value
      ? null
      : { mismatch: true };
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (response) => {
        this.usuarios = response.data || [];
        this.usuariosFiltrados = [...this.usuarios];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.notificacionService.error('No se pudieron cargar los usuarios');
        this.cargando = false;
      },
    });
  }
  crearUsuario(): void {
    console.log('Función crearUsuario() ejecutada');
    
    if (this.usuarioForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.usuarioForm.controls).forEach(key => {
        this.usuarioForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    const usuarioData = {
      nombre: this.usuarioForm.get('nombre')?.value,
      correo: this.usuarioForm.get('correo')?.value,
      rol: this.usuarioForm.get('rol')?.value,
      contrasena: this.usuarioForm.get('contrasena')?.value
    };
    
    console.log('Datos del usuario a crear:', usuarioData);
    
    this.cargando = true;
    
    this.usuarioService.crearUsuario(usuarioData).subscribe({
      next: (respuesta) => {
        console.log('Usuario creado:', respuesta);
        this.notificacionService.success('Usuario creado correctamente');
        this.resetForm();
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        this.notificacionService.error('Error al crear usuario: ' + 
          (error.error?.msg || 'Error desconocido'));
        this.cargando = false;
      }
    });
  }
  guardarUsuario(): void {
    if (this.usuarioForm.invalid) {
      Object.keys(this.usuarioForm.controls).forEach((key) => {
        this.usuarioForm.get(key)?.markAsTouched();
      });
      return;
    }
    const usuarioData = { ...this.usuarioForm.value };
    delete usuarioData.confirmarContrasena;
    this.cargando = true;
    if (this.modoEdicion) {
      this.usuarioService
        .actualizarUsuario(this.usuarioSeleccionado.id, usuarioData)
        .subscribe({
          next: () => {
            this.notificacionService.success(
              'Usuario actualizado correctamente'
            );
            this.resetForm();
            this.cargarUsuarios();
          },
          error: (error) => {
            console.error('Error al actualizar usuario:', error);
            this.notificacionService.error('No se pudo actualizar el usuario');
            this.cargando = false;
          },
        });
    } else {
      this.usuarioService.crearUsuario(usuarioData).subscribe({
        next: () => {
          this.notificacionService.success('Usuario creado correctamente');
          this.resetForm();
          this.cargarUsuarios();
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          this.notificacionService.error('No se pudo crear el usuario');
          this.cargando = false;
        },
      });
    }
  }
  seleccionarUsuario(usuario: any): void {
    this.usuarioSeleccionado = usuario;
    this.modoEdicion = true;

    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      numero_documento: usuario.numero_documento,
      telefono: usuario.telefono,
      rol: usuario.rol,
    });

    this.usuarioForm.get('numero_documento')?.disable();
    this.usuarioForm.get('contrasena')?.clearValidators();
    this.usuarioForm.get('confirmarContrasena')?.clearValidators();
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.usuarioForm.get('confirmarContrasena')?.updateValueAndValidity();
  }

  resetForm(): void {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.usuarioForm.reset({ rol: 'doctor' });
    this.usuarioForm.get('numero_documento')?.enable();

    this.usuarioForm
      .get('contrasena')
      ?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm
      .get('confirmarContrasena')
      ?.setValidators([Validators.required]);
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.usuarioForm.get('confirmarContrasena')?.updateValueAndValidity();

    this.cargando = false;
  }

  filtrarUsuarios(): void {
    const termino = this.searchTerm.toLowerCase().trim();
    if (!termino) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(termino) ||
        usuario.apellidos.toLowerCase().includes(termino) ||
        usuario.correo.toLowerCase().includes(termino) ||
        usuario.numero_documento.toLowerCase().includes(termino)
    );
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

  resetearContrasena(usuario: any): void {
    if (
      confirm(`¿Está seguro de resetear la contraseña de ${usuario.nombre}?`)
    ) {
      // Implementación para resetear contraseña
      this.notificacionService.info('Función en desarrollo');
    }
  }

  eliminarUsuario(usuario: any): void {
    if (confirm(`¿Está seguro de eliminar al usuario ${usuario.nombre}?`)) {
      this.cargando = true;
      this.usuarioService.eliminarUsuario(usuario.id).subscribe({
        next: () => {
          this.notificacionService.success('Usuario eliminado correctamente');
          this.cargarUsuarios();
        },
        error: (error: any) => {
          console.error('Error al eliminar usuario:', error);
          this.notificacionService.error('No se pudo eliminar el usuario');
          this.cargando = false;
        },
      });
    }
  }
  cancelarEdicion(): void {
    // Reset del formulario y configuración a modo creación
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.usuarioForm.reset({ rol: 'doctor' });

    // Habilitar campos que podrían estar deshabilitados en modo edición
    this.usuarioForm.get('numero_documento')?.enable();

    // Restablecer validadores para contraseñas si fueron modificados
    this.usuarioForm
      .get('contrasena')
      ?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm
      .get('confirmarContrasena')
      ?.setValidators([Validators.required]);
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.usuarioForm.get('confirmarContrasena')?.updateValueAndValidity();
  }
}
