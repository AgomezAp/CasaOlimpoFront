import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CrearConsentimientoComponent } from '../crear-consentimiento/crear-consentimiento.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ConsentimientoInfo,
  ConsentimientoInfoService,
} from '../../../services/consentimiento-info.service';
import SignaturePad from 'signature_pad';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-consentimiento-info',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consentimiento-info.component.html',
  styleUrl: './consentimiento-info.component.css',
})
export class ConsentimientoInfoComponent implements OnInit {
   @Input() pacienteId: string = ''; 
  consentimientos: ConsentimientoInfo[] = [];
  isLoading = false;
  error = '';
  success = '';
  consentimientoForm: FormGroup;
  tipoConsentimientoSeleccionado: string = '';
  pdfGenerado: string = '';
  guardando: boolean = false;
  fechaActual: Date = new Date();
  nombreDoctor: string = '';
  paciente: any = null;
  firmas: { [key: string]: SignaturePad } = {};
  consultaId: string = '';
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consentimientoService: ConsentimientoInfoService
  ) {
    this.consentimientoForm = this.fb.group({
      consentimiento_check: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
   if (!this.pacienteId) {
      this.pacienteId = this.route.snapshot.paramMap.get('numero_documento') || '';
    }
    if (this.pacienteId) {
      this.cargarConsentimientos();
    }
  }

  cargarConsentimientos(): void {
    if (!this.pacienteId) return;

    this.isLoading = true;
    this.error = '';

    this.consentimientoService
      .obtenerConsentimientosPaciente(this.pacienteId)
      .subscribe({
        next: (response) => {
          this.consentimientos = response.data || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message || 'Error al cargar los consentimientos';
          this.isLoading = false;
        },
      });
  }
  descargarConsentimiento(Cid: number): void {
    this.isLoading = true;
    this.error = '';
    this.success = '';

    this.consentimientoService.descargarConsentimiento(Cid).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consentimiento_${Cid}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al descargar el consentimiento';
        this.isLoading = false;
      },
    });
  }

  eliminarConsentimiento(Cid: number): void {
    if (!confirm('¿Está seguro que desea eliminar este consentimiento?'))
      return;

    this.isLoading = true;
    this.error = '';
    this.success = '';

    this.consentimientoService.eliminarConsentimiento(Cid).subscribe({
      next: (response) => {
        this.success = 'Consentimiento eliminado correctamente';
        this.cargarConsentimientos();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al eliminar el consentimiento';
        this.isLoading = false;
      },
    });
  }
  showConsentimientoModal = false;

  // Modificar el método actual para mostrar el modal en lugar de navegar
  crearNuevoConsentimiento(): void {
    this.showConsentimientoModal = true;
  }

  // Método para cerrar el modal
  cerrarModalConsentimiento(): void {
    this.showConsentimientoModal = false;
  }
  seleccionarTipoConsentimiento(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.tipoConsentimientoSeleccionado = select.value;

    // Resetear el formulario para el nuevo tipo
    this.consentimientoForm.get('consentimiento_check')?.setValue(false);

    // Dar tiempo al DOM para actualizar antes de inicializar las firmas
    setTimeout(() => {
      this.inicializarFirmas();
      // Corrección importante para asegurar visibilidad de los elementos
      this.aplicarEstilosCorrectivos();
    }, 300);
  }

  obtenerTituloConsentimiento(): string {
    switch (this.tipoConsentimientoSeleccionado) {
      case 'atencion_cliente':
        return 'ATENCIÓN AL CLIENTE';
      case 'acido_hialuronico':
        return 'ÁCIDO HIALURÓNICO';
      case 'dysport':
        return 'DYSPORT';
      case 'fibrina':
        return 'FIBRINA';
      case 'cauterizacion':
        return 'CAUTERIZACIÓN DE LUNARES';
      case 'limpieza_facial':
        return 'LIMPIEZA FACIAL';
      default:
        return '';
    }
  }

  // Método que asegura que todos los elementos tengan los estilos correctos para ser visibles
  aplicarEstilosCorrectivos(): void {
    // Asegurar que el contenedor principal sea visible
    const contenedor = document.getElementById('documento-consentimiento');
    if (contenedor) {
      contenedor.style.display = 'block';
      contenedor.style.visibility = 'visible';
      contenedor.style.height = 'auto';
      contenedor.style.overflow = 'visible';
      contenedor.style.backgroundColor = 'white';
      contenedor.style.color = 'black';
    }

    // Asegurar que el body del consentimiento seleccionado sea visible
    const bodyConsentimiento = document.querySelector(
      `.${this.tipoConsentimientoSeleccionado}`
    );
    if (bodyConsentimiento instanceof HTMLElement) {
      bodyConsentimiento.style.display = 'block';
      bodyConsentimiento.style.visibility = 'visible';
      bodyConsentimiento.style.backgroundColor = 'white';
      bodyConsentimiento.style.color = 'black';
    }

    // Asegurar que el cuerpo del consentimiento sea visible
    const consentimientoBody = document.querySelector(
      `.consentimiento-body.${this.tipoConsentimientoSeleccionado}`
    );
    if (consentimientoBody instanceof HTMLElement) {
      consentimientoBody.style.display = 'block';
      consentimientoBody.style.visibility = 'visible';
      consentimientoBody.style.height = 'auto';
      consentimientoBody.style.minHeight = '800px';
      consentimientoBody.style.overflow = 'visible';
      consentimientoBody.style.backgroundColor = 'white';
      consentimientoBody.style.color = 'black';
    }
  }

  inicializarFirmas(): void {
    // Limpiar instancias anteriores
    Object.values(this.firmas).forEach((firma) => {
      firma.off();
    });
    this.firmas = {};

    // Determinar qué IDs de canvas inicializar según el tipo de consentimiento
    const canvasIds: string[] = [];

    switch (this.tipoConsentimientoSeleccionado) {
      case 'acido_hialuronico':
        canvasIds.push(
          'firma-ciudad',
          'firma-alergias',
          'firma-paciente-adicional',
          'firma-documento'
        );
        break;
      case 'atencion_cliente':
        canvasIds.push(
          'firma-paciente-cliente',
          'firma-celular',
          'firma-cc-cliente',
          'firma-profesional',
          'firma-cc-profesional'
        );
        break;
      case 'dysport':
        canvasIds.push(
          'firma-fecha-dysport',
          'firma-nombre-dysport',
          'firma-cedula-dysport',
          'firma-ciudad-dysport',
          'firma-alergias-dysport',
          'firma-paciente-dysport',
          'firma-documento-dysport'
        );
        break;
      case 'fibrina':
        canvasIds.push(
          'firma-fecha-fibrina',
          'firma-nombre-fibrina',
          'firma-cedula-fibrina',
          'firma-ciudad-fibrina',
          'firma-alergias-fibrina',
          'firma-paciente-fibrina',
          'firma-documento-fibrina'
        );
        break;
      case 'cauterizacion':
        canvasIds.push(
          'firma-fecha-cauterizacion',
          'firma-nombre-cauterizacion',
          'firma-cedula-cauterizacion',
          'firma-ciudad-cauterizacion',
          'firma-alergias-cauterizacion',
          'firma-paciente-cauterizacion',
          'firma-documento-cauterizacion'
        );
        break;
      case 'limpieza_facial':
        canvasIds.push(
          'firma-fecha-limpieza',
          'firma-nombre-limpieza',
          'firma-cedula-limpieza',
          'firma-ciudad-limpieza',
          'firma-alergias-limpieza',
          'firma-paciente-limpieza',
          'firma-documento-limpieza'
        );
        break;
    }

    // Inicializar cada canvas encontrado
    canvasIds.forEach((id) => {
      const canvas = document.getElementById(id) as HTMLCanvasElement;
      if (canvas) {
        // Configurar el canvas con el tamaño correcto
        const ratio = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;

        // Crear signature_pad para este canvas
        const signaturePad = new SignaturePad(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)',
        });

        // Guardar la referencia
        this.firmas[id] = signaturePad;

        // Agregar botón para limpiar firma si no existe
        this.agregarBotonLimpiarFirma(canvas, id);
      } else {
        console.warn(`Canvas con ID "${id}" no encontrado`);
      }
    });
  }

  agregarBotonLimpiarFirma(canvas: HTMLCanvasElement, idCanvas: string): void {
    // Verificar si ya existe un botón para este canvas
    const idBoton = `btn-limpiar-${idCanvas}`;
    if (document.getElementById(idBoton)) {
      return; // El botón ya existe
    }

    const contenedor = canvas.parentElement;
    if (contenedor) {
      // Crear botón
      const boton = document.createElement('button');
      boton.id = idBoton;
      boton.className = 'btn-limpiar-firma';
      boton.title = 'Limpiar firma';
      boton.style.position = 'absolute';
      boton.style.top = '2px';
      boton.style.right = '2px';
      boton.style.backgroundColor = '#ff5252';
      boton.style.color = 'white';
      boton.style.border = 'none';
      boton.style.borderRadius = '50%';
      boton.style.width = '20px';
      boton.style.height = '20px';
      boton.style.fontSize = '12px';
      boton.style.cursor = 'pointer';
      boton.style.display = 'flex';
      boton.style.justifyContent = 'center';
      boton.style.alignItems = 'center';

      // Añadir evento para limpiar firma
      boton.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.firmas[idCanvas]) {
          this.firmas[idCanvas].clear();
        }
      });

      // Añadir el botón al contenedor
      contenedor.style.position = 'relative';
      contenedor.appendChild(boton);
    }
  }

  generarPDF(): void {
    // Validaciones iniciales
    if (!this.consentimientoForm.valid) {
      alert('Debe aceptar los términos del consentimiento');
      return;
    }

    // 1. NUEVO: Asegúrate de tener seleccionado un tipo de consentimiento
    if (!this.tipoConsentimientoSeleccionado) {
      alert('Debe seleccionar un tipo de consentimiento');
      return;
    }

    // 2. NUEVO: Mostrar un indicador de carga para más feedback visual
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '0';
    loadingIndicator.style.left = '0';
    loadingIndicator.style.width = '100%';
    loadingIndicator.style.height = '100%';
    loadingIndicator.style.backgroundColor = 'rgba(255,255,255,0.8)';
    loadingIndicator.style.display = 'flex';
    loadingIndicator.style.justifyContent = 'center';
    loadingIndicator.style.alignItems = 'center';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.innerHTML = '<h2>Generando PDF, por favor espere...</h2>';
    document.body.appendChild(loadingIndicator);

    // 3. CRÍTICO: Asegurar que el elemento a capturar existe
    const elemento = document.querySelector(
      `.consentimiento-body.${this.tipoConsentimientoSeleccionado}`
    );
    if (!elemento) {
      alert(
        `Error: No se encontró el contenido del consentimiento de ${this.obtenerTituloConsentimiento()}`
      );
      document.body.removeChild(loadingIndicator);
      return;
    }

    // 4. NUEVO: Ocultar temporalmente los botones de limpiar firma
    const botonesLimpiar = document.querySelectorAll('.btn-limpiar-firma');
    botonesLimpiar.forEach((btn) => {
      (btn as HTMLElement).style.display = 'none';
    });

    // 5. NUEVO: Crear un contenedor temporal para capturar correctamente
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '1500px'; // Ancho fijo para mejor renderizado
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';

    // 6. CRÍTICO: Agregar el encabezado al clon
    const header = document.querySelector('.consentimiento-header');
    tempDiv.innerHTML = `
    ${header ? header.outerHTML : ''}
    ${elemento.outerHTML}
  `;
    document.body.appendChild(tempDiv);

    // 7. CRÍTICO: Forzar estilos para elementos en el clon
    const allElementsInClone = tempDiv.querySelectorAll('*');
    allElementsInClone.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.visibility = 'visible';
        el.style.display = el.tagName === 'LI' ? 'list-item' : 'block';
        el.style.position = 'static';
        el.style.height = 'auto';
        el.style.color = 'black';
        el.style.backgroundColor = 'white';

        // Especial para consentimientos y secciones
        if (el.classList.contains('consentimiento-body')) {
          el.style.minHeight = '800px';
        }
      }
    });

    // 8. NUEVO: Copiar el contenido de los canvas (firmas)
    const canvasOriginales = document.querySelectorAll(
      `.${this.tipoConsentimientoSeleccionado} canvas`
    );
    const canvasClon = tempDiv.querySelectorAll('canvas');

    for (let i = 0; i < canvasOriginales.length && i < canvasClon.length; i++) {
      try {
        const original = canvasOriginales[i] as HTMLCanvasElement;
        const clon = canvasClon[i] as HTMLCanvasElement;

        // Asegurar dimensiones iguales
        clon.width = original.width;
        clon.height = original.height;

        // Copiar contenido
        const context = clon.getContext('2d');
        if (context) {
          context.drawImage(original, 0, 0);
        }
      } catch (e) {
        console.error('Error copiando canvas:', e);
      }
    }

    // 9. CRÍTICO: Tiempo de espera mayor para asegurar el renderizado completo
    setTimeout(() => {
      html2canvas(tempDiv, {
        scale: 1, // Mayor escala para mejor calidad
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: tempDiv.offsetWidth,
        height: tempDiv.scrollHeight,
      })
        .then((canvas) => {
          try {
            // Crear PDF
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;

            // Manejar múltiples páginas si es necesario
            if (imgHeight * ratio > pdfHeight) {
              let heightLeft = imgHeight;
              let position = 0;
              let page = 0;

              while (heightLeft > 0) {
                if (page > 0) {
                  pdf.addPage();
                }

                pdf.addImage(
                  imgData,
                  'JPEG',
                  imgX,
                  position * ratio * -1,
                  imgWidth * ratio,
                  imgHeight * ratio
                );

                heightLeft -= pdfHeight / ratio;
                position += pdfHeight / ratio;
                page++;
              }
            } else {
              pdf.addImage(
                imgData,
                'JPEG',
                imgX,
                0,
                imgWidth * ratio,
                imgHeight * ratio
              );
            }

            // 10. NUEVO: Mostrar y guardar el PDF
            this.pdfGenerado = pdf.output('datauristring');

            // Abrir en nueva ventana para previsualización
            window.open(URL.createObjectURL(pdf.output('blob')));

            // Limpiar elementos temporales
            document.body.removeChild(tempDiv);
            document.body.removeChild(loadingIndicator);

            // Restaurar visibilidad de botones
            botonesLimpiar.forEach((btn) => {
              (btn as HTMLElement).style.display = '';
            });

            // 11. CRÍTICO: Enviar consentimiento automáticamente
            this.guardando = true;
            this.enviarConsentimiento();
          } catch (error) {
            console.error('Error creando el PDF:', error);
            document.body.removeChild(tempDiv);
            document.body.removeChild(loadingIndicator);
            botonesLimpiar.forEach((btn) => {
              (btn as HTMLElement).style.display = '';
            });
            alert('Error al crear el PDF: ' + (error as Error).message);
          }
        })
        .catch((error) => {
          console.error('Error en html2canvas:', error);
          document.body.removeChild(tempDiv);
          document.body.removeChild(loadingIndicator);
          botonesLimpiar.forEach((btn) => {
            (btn as HTMLElement).style.display = '';
          });
          alert('Error al capturar el documento: ' + (error as Error).message);
        });
    }, 2000); // Mayor tiempo de espera para asegurar la carga completa
  }

  async generarPDFSilencioso(): Promise<void> {
    this.guardando = true;

    // Ocultar botones de limpiar firma
    const botonesLimpiar = document.querySelectorAll('.btn-limpiar-firma');
    botonesLimpiar.forEach((boton) => {
      (boton as HTMLElement).style.display = 'none';
    });

    const instrucciones = document.querySelector('.firma-instructions');
    let instruccionesDisplay = '';
    if (instrucciones) {
      instruccionesDisplay = (instrucciones as HTMLElement).style.display;
      (instrucciones as HTMLElement).style.display = 'none';
    }

    // Crear una copia del contenido para manipularlo
    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-pdf-container-silent';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';

    const originalElement = document.getElementById('documento-consentimiento');
    if (!originalElement) {
      throw new Error('No se encontró el elemento del documento');
    }

    tempDiv.innerHTML = originalElement.innerHTML;
    document.body.appendChild(tempDiv);

    try {
      // Aplicar estilos para asegurar visibilidad
      const allElements = tempDiv.querySelectorAll('*');
      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.visibility = 'visible';
          el.style.display = el.tagName === 'LI' ? 'list-item' : 'block';
          el.style.color = 'black';
          el.style.backgroundColor = 'white';
        }
      });

      // Asegurar visibilidad del consentimiento actual
      const consentimientoBody = tempDiv.querySelector(
        `.consentimiento-body.${this.tipoConsentimientoSeleccionado}`
      );
      if (consentimientoBody instanceof HTMLElement) {
        consentimientoBody.style.display = 'block';
        consentimientoBody.style.visibility = 'visible';
        consentimientoBody.style.height = 'auto';
        consentimientoBody.style.minHeight = '800px';
      }

      // Copiar firmas
      const canvasOriginales = originalElement.querySelectorAll('canvas');
      const canvasCopia = tempDiv.querySelectorAll('canvas');

      for (
        let i = 0;
        i < canvasOriginales.length && i < canvasCopia.length;
        i++
      ) {
        try {
          const ctxOrig = canvasOriginales[i] as HTMLCanvasElement;
          const ctxCopia = canvasCopia[i] as HTMLCanvasElement;

          ctxCopia.width = ctxOrig.width;
          ctxCopia.height = ctxOrig.height;

          const ctx = ctxCopia.getContext('2d');
          if (ctx && ctxOrig) {
            ctx.drawImage(ctxOrig, 0, 0);
          }
        } catch (error) {
          console.error('Error copiando canvas:', error);
        }
      }

      // Generar el PDF
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: tempDiv.offsetWidth,
            height: tempDiv.scrollHeight,
          })
            .then((canvas: any) => {
              try {
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdf = new jsPDF('p', 'mm', 'a4');

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                const imgX = 0; // Elimina el centrado para usar todo el ancho
                const ratio = pdfWidth / imgWidth;

                if (imgHeight * ratio > pdfHeight) {
                  let heightLeft = imgHeight;
                  let position = 0;
                  let page = 0;

                  while (heightLeft > 0) {
                    if (page > 0) {
                      pdf.addPage();
                    }

                    pdf.addImage(
                      imgData,
                      'JPEG',
                      imgX,
                      position * ratio * -1,
                      imgWidth * ratio,
                      imgHeight * ratio
                    );

                    heightLeft -= pdfHeight / ratio;
                    position += pdfHeight / ratio;
                    page++;
                  }
                } else {
                  pdf.addImage(
                    imgData,
                    'JPEG',
                    imgX,
                    0,
                    imgWidth * ratio,
                    imgHeight * ratio
                  );
                }

                this.pdfGenerado = pdf.output('datauristring');

                document.body.removeChild(tempDiv);
                botonesLimpiar.forEach((boton) => {
                  (boton as HTMLElement).style.display = '';
                });

                if (instrucciones) {
                  (instrucciones as HTMLElement).style.display =
                    instruccionesDisplay;
                }

                resolve();
              } catch (error) {
                document.body.removeChild(tempDiv);
                botonesLimpiar.forEach((boton) => {
                  (boton as HTMLElement).style.display = '';
                });

                if (instrucciones) {
                  (instrucciones as HTMLElement).style.display =
                    instruccionesDisplay;
                }

                reject(error);
              }
            })
            .catch((error: any) => {
              document.body.removeChild(tempDiv);
              botonesLimpiar.forEach((boton) => {
                (boton as HTMLElement).style.display = '';
              });

              if (instrucciones) {
                (instrucciones as HTMLElement).style.display =
                  instruccionesDisplay;
              }

              reject(error);
            });
        }, 1500);
      });
    } catch (error) {
      if (document.getElementById('temp-pdf-container-silent')) {
        document.body.removeChild(
          document.getElementById('temp-pdf-container-silent')!
        );
      }

      botonesLimpiar.forEach((boton) => {
        (boton as HTMLElement).style.display = '';
      });

      if (instrucciones) {
        (instrucciones as HTMLElement).style.display = instruccionesDisplay;
      }

      return Promise.reject(error);
    }
  }

  enviarConsentimiento(): void {
    if (!this.pdfGenerado) {
      alert('Error: No se ha generado el PDF correctamente');
      this.guardando = false;
      return;
    }
    try {
      // Extraer la parte de datos del data URI
      const base64Data = this.pdfGenerado.split(',')[1];
      // Convertir base64 a array de bytes
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      // Crear blob
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

      // CORRECCIÓN: Convertir Blob a File
      const fileName = `consentimiento_${
        this.tipoConsentimientoSeleccionado
      }_${new Date().getTime()}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, {
        type: 'application/pdf',
      });

      // Verificar que el pacienteId existe
      if (!this.pacienteId) {
        throw new Error('ID de paciente no disponible');
      }

      // Usar el File en lugar del Blob
      this.consentimientoService
        .guardarConsentimiento(this.pacienteId, pdfFile)
        .subscribe({
          next: (response: any) => {
            this.guardando = false;
            alert('Consentimiento guardado correctamente');
            // Recargar la lista de consentimientos
            this.cargarConsentimientos();
            // Cerrar el modal
            this.cerrarModalConsentimiento();
          },
          error: (err: any) => {
            this.guardando = false;
            console.error('Error al guardar el consentimiento:', err);
            alert(
              'Error al guardar el consentimiento: ' +
                (err.error?.message || err.message || 'Error desconocido')
            );
          },
        });
    } catch (error) {
      this.guardando = false;
      console.error('Error al procesar el PDF:', error);
      alert('Error al procesar el PDF: ' + (error as Error).message);
    }
  }

  limpiarFirma(id: string): void {
    if (this.firmas[id]) {
      this.firmas[id].clear();
    }
  }
}
