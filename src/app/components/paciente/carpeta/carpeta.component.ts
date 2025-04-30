import { Component, Input, OnInit } from '@angular/core';
import { CarpetaService } from '../../../services/carpeta.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Carpeta } from '../../../interfaces/carpeta';
import { environment } from '../../../environments/environments';
interface ImagenMetadata {
  id: string;
  ruta: string;
  nombre_archivo: string;
  descripcion: string;
  fecha_subida: string;
}
@Component({
  selector: 'app-carpeta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carpeta.component.html',
  styleUrl: './carpeta.component.css'
})
export class CarpetaComponent implements OnInit {
  @Input() pacienteId: string = '';
  
  carpeta: Carpeta | null = null;
  imagenes: ImagenMetadata[] = [];
  
  loading: boolean = false;
  error: string = '';
  mostrarFormularioSubida: boolean = false;
  // Variables para crear carpeta
  nuevaCarpetaNombre: string = '';
  
  // Variables para subir imagen
  archivoSeleccionado: File | null = null;
  descripcionImagen: string = '';
  
  // Variable para vista previa
  imagenSeleccionada: ImagenMetadata | null = null;
  
  constructor(private carpetaService: CarpetaService) { }
  
  ngOnInit(): void {
    if (this.pacienteId) {
      this.verificarCarpeta();
    }
  }
  
  verificarCarpeta(): void {
    this.loading = true;
    this.carpetaService.obtenerCarpeta(this.pacienteId).subscribe({
      next: (response) => {
        this.carpeta = response.data;
        
        // Parsear el JSON de metadatos de imágenes
        if (this.carpeta && this.carpeta.imagen_metadata) {
          try {
            this.imagenes = JSON.parse(this.carpeta.imagen_metadata);
          } catch (e) {
            this.imagenes = [];
            console.error('Error al parsear metadatos de imágenes:', e);
          }
        } else {
          this.imagenes = [];
        }
        
        this.loading = false;
      },
      error: (error) => {
        if (error.status === 404) {
          // No hacer nada, es un caso esperado: mostraremos la interfaz para crear carpeta
          this.error = '';
        } else {
          // Solo registrar en consola errores no esperados
          console.error('Error al verificar carpeta:', error);
          this.error = 'Error al verificar la carpeta del paciente.';
        }
        this.loading = false;
      }
    });
  }
  
  crearCarpeta(): void {
    if (!this.nuevaCarpetaNombre.trim()) {
      this.error = 'Por favor ingrese un nombre para la carpeta';
      return;
    }
    
    this.loading = true;
    const carpetaData = {
      numero_documento: this.pacienteId,
      descripcion: this.nuevaCarpetaNombre.trim()
    };
    
    this.carpetaService.crearCarpeta(carpetaData).subscribe({
      next: (response) => {
        this.carpeta = response.data;
        this.imagenes = [];
        this.nuevaCarpetaNombre = '';
        this.loading = false;
        this.error = '';
      },
      error: (error) => {
        console.error('Error al crear carpeta:', error);
        this.error = 'No se pudo crear la carpeta para este paciente.';
        this.loading = false;
      }
    });
  }
  
  onFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.archivoSeleccionado = fileList[0];
    }
  }
  
  subirImagen(): void {
    if (!this.archivoSeleccionado) {
      this.error = 'Por favor seleccione una imagen';
      return;
    }
    
    if (!this.carpeta?.CarpetaId) {
      this.error = 'No hay una carpeta activa para este paciente';
      return;
    }
    
    this.loading = true;
    this.carpetaService.subirImagen(
      this.carpeta.CarpetaId.toString(), 
      this.archivoSeleccionado, 
      this.descripcionImagen
    ).subscribe({
      next: (response) => {
        // Añadir la nueva imagen a nuestra lista
        if (response.data) {
          this.imagenes.push(response.data);
        }
        this.loading = false;
        this.archivoSeleccionado = null;
        this.descripcionImagen = '';
        
        // Reiniciar el campo de archivo
        const inputElement = document.getElementById('fileInput') as HTMLInputElement;
        if (inputElement) {
          inputElement.value = '';
        }
      },
      error: (error) => {
        console.error('Error al subir imagen:', error);
        this.error = 'No se pudo subir la imagen: ' + (error.error?.message || '');
        this.loading = false;
      }
    });
  }
  
  eliminarImagen(imagen: ImagenMetadata): void {
    if (!this.carpeta?.CarpetaId) {
      return;
    }
    
    if (confirm('¿Está seguro que desea eliminar esta imagen?')) {
      this.loading = true;
      this.carpetaService.eliminarImagen(
        this.carpeta.CarpetaId.toString(), 
        imagen.id
      ).subscribe({
        next: () => {
          this.imagenes = this.imagenes.filter(img => img.id !== imagen.id);
          this.loading = false;
          
          if (this.imagenSeleccionada?.id === imagen.id) {
            this.imagenSeleccionada = null;
          }
        },
        error: (error) => {
          console.error('Error al eliminar imagen:', error);
          this.error = 'No se pudo eliminar la imagen';
          this.loading = false;
        }
      });
    }
  }
  handleImageError(event: any): void {
    console.error('Error al cargar la imagen:', event);
    
    // Usar un Data URI como placeholder para evitar otro request
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZWVlZWVlIiAvPgogICAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+SW1hZ2VuPC90ZXh0PgogICAgPHRleHQgeD0iNTAlIiB5PSI2NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+bm8gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+Cg==';
    
    // Evitar que se sigan disparando eventos de error
    event.target.onerror = null;
  }
  
  verImagen(imagen: ImagenMetadata): void {
    this.imagenSeleccionada = imagen;
  }
  
  cerrarVistaPrevia(): void {
    this.imagenSeleccionada = null;
  }
  
  obtenerFechaFormateada(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }
  
  getImageUrl(ruta: string): string {
    // Si no hay ruta, devolver un placeholder
    if (!ruta) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZWVlZWVlIiAvPgogICAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+SW1hZ2VuPC90ZXh0PgogICAgPHRleHQgeD0iNTAlIiB5PSI2NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+bm8gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+Cg==';
    }
    
    // Si ya es una URL completa
    if (ruta.startsWith('http')) {
      return ruta;
    }
    
    // Eliminar la barra inicial de la ruta si apiUrl termina con barra
    const apiUrl = environment.apiUrl;
    const cleanPath = ruta.startsWith('/') ? ruta.substring(1) : ruta;
    
    // Construir la URL correctamente sin doble barra
    const fullUrl = `${apiUrl}${cleanPath}`;
    console.log('URL imagen:', fullUrl);
    return fullUrl;
  }
  
}
