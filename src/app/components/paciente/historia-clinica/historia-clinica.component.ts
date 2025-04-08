import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Consulta } from '../../../interfaces/consulta';
import { ConsultaService } from '../../../services/consulta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule,],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})
export class HistoriaClinicaComponent implements OnInit, OnDestroy {
  @Input() pacienteId: string = '';
  consultas: Consulta[] = [];
  cargando: boolean = true;
  cargandoConsultas: boolean = true;
  cargandoInformacion: boolean = true;
  error: string | null = null;
  numeroDocumento: string = '';
  fechaCreacionHistoria: Date | null = null;
  tieneConsultaAbierta: boolean = false;
  paginaActual: number = 1;
  elementosPorPagina: number = 5; // 5 consultas por página
  totalConsultas: number = 0;
  
  // Para manejar cierres individuales
  cargandoCierre: {[key: number]: boolean} = {};
  cargandoPDF: { [key: number]: boolean } = {};
  // Para limpieza
  private subscriptions: Subscription[] = [];
  
  constructor(
    private consultaService: ConsultaService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Obtener el número de documento del paciente de la URL
    const routeSub = this.route.parent?.params.subscribe(params => {
      this.numeroDocumento = params['numero_documento'];
      if (this.numeroDocumento) {
        // Cargar información básica y consultas en paralelo
        this.cargarInformacionBasica();
        this.cargarConsultasDePaciente();
      } else {
        // Último intento: verificar si hay un parámetro en la URL actual
        const paramSub = this.route.params.subscribe(routeParams => {
          this.numeroDocumento = routeParams['numero_documento'];
          if (this.numeroDocumento) {
            this.cargarInformacionBasica();
            this.cargarConsultasDePaciente();
          } else {
            this.error = 'No se pudo identificar al paciente';
            this.cargando = false;
          }
        });
        this.subscriptions.push(paramSub);
      }
    });
    if (routeSub) this.subscriptions.push(routeSub);
  }
  
  // Cargar información básica primero (rápido)
  cargarInformacionBasica(): void {
    const infoSub = this.consultaService.obtenerInformacionBasicaPaciente(this.numeroDocumento)
      .pipe(
        finalize(() => {
          this.cargandoInformacion = false;
          // Si ya tenemos las consultas, desactivar cargando general
          if (!this.cargandoConsultas) {
            this.cargando = false;
          }
        })
      )
      .subscribe({
        next: (info:any) => {
          this.fechaCreacionHistoria = info.fechaCreacion ? new Date(info.fechaCreacion) : null;
          this.tieneConsultaAbierta = info.tieneConsultaAbierta;
        },
        error: (err:any) => {
          console.error("Error al cargar información básica:", err);
          // No mostrar error aquí, seguimos con las consultas
        }
      });
    this.subscriptions.push(infoSub);
  }
  get totalPaginas(): number {
    return Math.ceil(this.totalConsultas / this.elementosPorPagina);
  }
  
  // Método para cargar consultas paginadas
  cargarConsultasPaginadas(pagina: number): void {
    if (pagina < 1 || (this.totalPaginas > 0 && pagina > this.totalPaginas)) {
      return;
    }
    
    this.cargandoConsultas = true;
    
    // Usar el método existente por ahora, después implementar paginación real
    const consultasSub = this.consultaService.obtenerConsultasOptimizadas(this.numeroDocumento)
      .pipe(
        finalize(() => {
          this.cargandoConsultas = false;
        })
      )
      .subscribe({
        next: (consultas) => {
          this.consultas = consultas;
          this.totalConsultas = consultas.length;
          this.paginaActual = pagina;
          
          // Aplicar paginación manual (para pruebas)
          const inicio = (pagina - 1) * this.elementosPorPagina;
          const fin = inicio + this.elementosPorPagina;
          this.consultas = consultas.slice(inicio, fin);
        },
        error: (err) => {
          this.error = 'Error al cargar las historias clínicas';
          console.error('Detalles:', err);
        }
      });
      
    this.subscriptions.push(consultasSub);
  }
  cargarConsultasDePaciente(): void {
    const consultasSub = this.consultaService.obtenerConsultasOptimizadas(this.numeroDocumento)
      .pipe(
        finalize(() => {
          this.cargandoConsultas = false;
          // Si ya tenemos la información básica, desactivar cargando general
          if (!this.cargandoInformacion) {
            this.cargando = false;
          }
        })
      )
      .subscribe({
        next: (consultas) => {
          this.consultas = consultas;
          
          // Verificar si existe alguna consulta abierta
          this.tieneConsultaAbierta = this.consultas.some(consulta => consulta.abierto);
          
          // Si no tenemos fecha de creación de la información básica, la calculamos
          if (!this.fechaCreacionHistoria && this.consultas.length > 0) {
            const fechaMasAntigua = this.consultas.reduce((min, consulta) => {
              const fecha = new Date(consulta.fecha);
              return fecha < min ? fecha : min;
            }, new Date(this.consultas[0].fecha));
            this.fechaCreacionHistoria = fechaMasAntigua;
          }
        },
        error: (err) => {
          this.error = 'Error al cargar las historias clínicas';
          console.error('Detalles:', err);
        }
      });
    this.subscriptions.push(consultasSub);
  }

  formatearFecha(fecha: any): string {
    // Aplicar formateo rápido sin llamadas externas
    if (!fecha) return 'Fecha desconocida';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  nuevaConsulta(): void {
    if (this.tieneConsultaAbierta) {
      this.mostrarNotificacion('Debe cerrar la historia clínica actual antes de crear una nueva.', true);
      return;
    }
    this.router.navigate(['/crear-consulta', this.numeroDocumento]);
  }

  editarConsulta(consulta: Consulta): void {
    this.router.navigate(['/paciente', this.numeroDocumento, 'consulta', consulta.Cid, 'editar']);
  }
  
  verDetalles(consulta: Consulta): void {
    this.router.navigate(['/paciente', this.numeroDocumento, 'consulta', consulta.Cid]);
  }

  cerrarConsulta(consulta: Consulta): void {
    if (!consulta.abierto) return;
    
    // Activar indicador individual para esta consulta
    this.cargandoCierre[consulta.Cid] = true;
    
    // Datos para el cierre
    const datosCierre = {
      Uid: localStorage.getItem('userId') || '0'
    };
  
    const cierreSub = this.consultaService.cerrarConsulta(this.numeroDocumento, consulta.Cid, datosCierre)
      .pipe(
        finalize(() => {
          // Desactivar indicador individual
          this.cargandoCierre[consulta.Cid] = false;
        })
      )
      .subscribe({
        next: () => {
          // Actualizar solo esta consulta
          consulta.abierto = false;
          
          // Verificar si aún hay alguna consulta abierta
          this.tieneConsultaAbierta = this.consultas.some(c => c.abierto);
          
          // Mostrar notificación no bloqueante
          this.mostrarNotificacion('Historia clínica cerrada correctamente');
        },
        error: (err) => {
          console.error('Error al cerrar la consulta:', err);
          this.mostrarNotificacion('No se pudo cerrar la historia clínica', true);
        }
      });
    
    this.subscriptions.push(cierreSub);
  }
  
  verConsentimientoPDF(consulta: Consulta): void {
    // Evitar múltiples clics
    if (this.cargandoPDF[consulta.Cid]) return;
    
    // Activar indicador de carga
    this.cargandoPDF[consulta.Cid] = true;
    
    const pdfSub = this.consultaService.obtenerConsentimientoPDF(consulta.Cid)
      .pipe(
        finalize(() => {
          this.cargandoPDF[consulta.Cid] = false;
        })
      )
      .subscribe({
        next: (documentoBlob) => {
          // Determinar el tipo de archivo para la URL
          const tipoArchivo = documentoBlob.type || 'application/octet-stream';
          console.log('Tipo de documento recibido:', tipoArchivo);
          
          // Crear URL del blob para visualizar/descargar
          const documentoUrl = URL.createObjectURL(documentoBlob);
          
          // Si es un PDF, abrirlo en el navegador
          if (tipoArchivo.includes('pdf')) {
            this.abrirPDFEnNuevaVentana(documentoUrl, `Consentimiento-${consulta.Cid}`);
          } else {
            // Si es otro formato, intentar descargarlo
            this.descargarArchivo(documentoBlob, `Consentimiento-${consulta.Cid}`);
          }
        },
        error: (err) => {
          console.error('Error al obtener el PDF:', err);
          
          if (err.status === 404 || err.message?.includes('no encontrado')) {
            this.mostrarNotificacion('Esta consulta no tiene un documento de consentimiento', true);
          } else {
            this.mostrarNotificacion('Error al descargar el documento: ' + (err.message || 'Error desconocido'), true);
          }
        }
      });
      
    this.subscriptions.push(pdfSub);
  }
  
  /**
   * Método para descargar directamente cualquier tipo de archivo
   */
  private descargarArchivo(blob: Blob, nombreArchivo: string): void {
    // Determinar la extensión basada en el tipo MIME
    let extension = '.pdf'; // Por defecto
    
    if (blob.type) {
      const mimeType = blob.type.toLowerCase();
      if (mimeType.includes('pdf')) extension = '.pdf';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = '.jpg';
      else if (mimeType.includes('png')) extension = '.png';
      else if (mimeType.includes('text')) extension = '.txt';
      // Puedes añadir más tipos según sea necesario
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreArchivo}${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar la URL del objeto después de un tiempo
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    this.mostrarNotificacion('Documento descargado correctamente');
  }
  
  /**
   * Abre el PDF en una nueva ventana del navegador
   */
  private abrirPDFEnNuevaVentana(pdfUrl: string, nombreArchivo: string): void {
    // Intentar abrir en nueva pestaña
    const nuevaVentana = window.open(pdfUrl, '_blank');
    
    if (!nuevaVentana) {
      // Si falla, ofrecer descarga directa
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${nombreArchivo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.mostrarNotificacion(
        'El navegador bloqueó la apertura del documento. Se ha iniciado la descarga automáticamente.', 
        false
      );
    }
  }
  
  /**
   * Muestra una notificación no bloqueante
   */
  mostrarNotificacion(mensaje: string, esError: boolean = false): void {
    const div = document.createElement('div');
    div.className = `notificacion ${esError ? 'error' : 'exito'}`;
    div.textContent = mensaje;
    document.body.appendChild(div);
    
    setTimeout(() => {
      div.classList.add('mostrar');
      setTimeout(() => {
        div.classList.remove('mostrar');
        setTimeout(() => {
          if (document.body.contains(div)) {
            document.body.removeChild(div);
          }
        }, 300);
      }, 2500);
    }, 10);
  }
  
  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}