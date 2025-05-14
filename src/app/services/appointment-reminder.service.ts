import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  forkJoin,
  interval,
  Observable,
  Subscription,
} from 'rxjs';
import { AgendaService } from './agenda.service';
import { NotificacionService } from './notificacion.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentReminderService {
  private readonly CACHE_KEY = 'casaolimpo_appointments_cache';
  private readonly CACHE_EXPIRY = 15 * 60 * 1000;
  // Contadores para mostrar en la interfaz
  private citasHoySubject = new BehaviorSubject<number>(0);
  private citasProximasSubject = new BehaviorSubject<number>(0);

  // Lista completa de citas próximas para mostrar en modal
  private citasProximasListSubject = new BehaviorSubject<any[]>([]);

  // Control para mostrar notificaciones
  private showNotificationSubject = new BehaviorSubject<boolean>(false);
  private notificacionYaMostrada = false;

  // Cita inminente (a punto de comenzar)
  private citaInminenteSubject = new BehaviorSubject<any>(null);

  // Citas disponibles en caché
  private citasDeHoyCache: any[] = [];
  private citasProximasCache: any[] = [];

  // Control de temporizadores
  private temporizadorCitasInminentes?: Subscription;
  private temporizadorRefresh?: Subscription;

  private tieneCitasPendientes = false;
  private notificacionHaSidoSolicitada = false;
  constructor(
    private agendaService: AgendaService,
    private notificacionService: NotificacionService
  ) {
    // Iniciar el sistema de notificaciones
    this.iniciarSistemaNotificaciones();
  }

  // Observables públicos para componentes que necesitan esta información
  get citasHoy$(): Observable<number> {
    return this.citasHoySubject.asObservable();
  }

  get citasProximas$(): Observable<number> {
    return this.citasProximasSubject.asObservable();
  }

  get citasProximasList$(): Observable<any[]> {
    return this.citasProximasListSubject.asObservable();
  }

  get showNotification$(): Observable<boolean> {
    return this.showNotificationSubject.asObservable();
  }

  get citaInminente$(): Observable<any> {
    return this.citaInminenteSubject.asObservable();
  }

  // Iniciar todo el sistema de notificaciones
  private iniciarSistemaNotificaciones(): void {
    console.log('Iniciando sistema de notificaciones de citas...');

    // Cargar citas inicialmente
    this.cargarTodasLasCitas();

    // Configurar actualizaciones automáticas cada 5 minutos
    this.temporizadorRefresh = interval(5 * 60 * 1000).subscribe(() => {
      console.log('Actualizando datos de citas automáticamente...');
      this.cargarTodasLasCitas();
    });
  }

  // Carga todas las citas desde el servicio
  private cargarTodasLasCitas(): void {
    console.log('Intentando cargar citas para notificaciones...');

    // Intentar recuperar de la caché primero
    const cachedData = this.getCachedAppointments();

    if (cachedData) {
      console.log(
        '✅ Usando datos de caché. Encontradas',
        cachedData.length,
        'citas'
      );
      this.procesarCitas(cachedData);
      return;
    }

    console.log('⚠️ No hay caché disponible. Cargando desde el servidor...');

    // Si no hay caché válida, cargar del servidor
    this.agendaService.getAllAppointments().subscribe({
      next: (citas) => {
        console.log(`Recibidas ${citas.length} citas del servidor`);

        // Guardar en caché para uso futuro
        this.cacheAppointments(citas);

        // Procesar las citas
        this.procesarCitas(citas);
      },
      error: (error) => {
        console.error('Error cargando citas para notificaciones:', error);
      },
    });
  }
  private cacheAppointments(citas: any[]): void {
    try {
      const now = new Date().getTime();
      const cacheData = {
        timestamp: now,
        expiry: now + this.CACHE_EXPIRY,
        data: citas,
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('✓ Datos guardados en caché. Expirarán en 15 minutos');
    } catch (e) {
      console.error('Error guardando datos en caché:', e);
    }
  }
  private getCachedAppointments(): any[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = new Date().getTime();

      // Verificar si la caché ha expirado
      if (now > cacheData.expiry) {
        console.log('⚠️ Caché expirada, eliminando datos');
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return cacheData.data;
    } catch (e) {
      console.error('Error recuperando datos de caché:', e);
      return null;
    }
  }
  public limpiarCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    console.log('✓ Caché de citas eliminada');
  }
  // Procesa las citas recibidas y actualiza las diferentes categorías
  public procesarCitas(citas: any[]): void {
    console.log('Desglose de citas a procesar:');
    const citasRegistradas = citas.filter((c) => this.esRegistrado(c)).length;
    const citasNoRegistradas = citas.filter(
      (c) => !this.esRegistrado(c)
    ).length;
    console.log(
      `Total: ${citas.length} (${citasRegistradas} registradas, ${citasNoRegistradas} no registradas)`
    );
    if (!citas || !Array.isArray(citas)) {
      console.warn('No se recibieron citas o formato inválido');
      return;
    }

    console.log(`Procesando ${citas.length} citas...`);

    // Fecha y hora actuales
    const ahora = new Date();

    // Fechas de referencia (resetear a medianoche)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const finDeSemana = new Date(hoy);
    finDeSemana.setDate(finDeSemana.getDate() + 7);

    // 1. Filtrar citas activas (no canceladas ni completadas)
    const citasActivas = citas.filter((cita) => {
      const estado = this.normalizarEstado(cita);
      // IMPORTANTE: Quitar 'confirmada' de los estados excluidos
      // Las citas confirmadas son válidas y deben generar notificaciones
      const estadosInactivos = [
        'cancelada',
        'cancelado',
        'cancelled',
        'completed',
        'completada',
        'finalizada',
      ];
      return !estadosInactivos.includes(estado);
    });

    // Añadir este log adicional para diagnóstico
    console.log('Estados de citas después del filtrado:');
    const registradas = citasActivas.filter(
      (c) => c.isRegistered !== false
    ).length;
    const noRegistradas = citasActivas.filter(
      (c) => c.isRegistered === false
    ).length;
    console.log(
      `Total: ${citasActivas.length} (${registradas} registradas, ${noRegistradas} no registradas)`
    );

    // 2. Citas de hoy pendientes
    this.citasDeHoyCache = citasActivas.filter((cita) => {
      const fechaCita = this.obtenerFechaCita(cita);
      if (!fechaCita) return false;

      const esHoy = this.sonMismoDia(fechaCita, hoy);
      if (!esHoy) return false;

      // Si tiene hora, verificar que no ha pasado ya
      const horaCita = this.obtenerHoraCita(cita);
      if (horaCita) {
        const fechaHoraCita = new Date(fechaCita);
        const [horas, minutos] = horaCita.split(':').map(Number);
        fechaHoraCita.setHours(horas, minutos);
        return fechaHoraCita >= ahora;
      }

      return true;
    });

    // 3. Citas próximas (de mañana hasta una semana)
    this.citasProximasCache = citasActivas.filter((cita) => {
      const fechaCita = this.obtenerFechaCita(cita);
      if (!fechaCita) return false;

      return fechaCita > manana && fechaCita <= finDeSemana;
    });

    // 4. Actualizar contadores y listas
    this.citasHoySubject.next(this.citasDeHoyCache.length);
    this.citasProximasSubject.next(this.citasProximasCache.length);
    this.citasProximasListSubject.next([
      ...this.citasDeHoyCache,
      ...this.citasProximasCache,
    ]);

    console.log(
      `Encontradas ${this.citasDeHoyCache.length} citas para hoy y ${this.citasProximasCache.length} próximas`
    );

    // 5. Mostrar notificación si es necesario
    if (this.citasDeHoyCache.length > 0 || this.citasProximasCache.length > 0) {
      // Almacenamos la información pero sin activar el popup
      this.tieneCitasPendientes = true;
    } else {
      this.tieneCitasPendientes = false;
    }
    // Mantener el popup cerrado a menos que explícitamente se pida mostrarlo
    if (!this.notificacionHaSidoSolicitada) {
      this.showNotificationSubject.next(false);
    }
    // 6. Iniciar verificación de citas inminentes
    this.iniciarVerificadorCitasInminentes();
  }

  // Iniciar el verificador de citas inminentes
  private iniciarVerificadorCitasInminentes(): void {
    // Cancelar temporizador anterior si existe
    if (this.temporizadorCitasInminentes) {
      this.temporizadorCitasInminentes.unsubscribe();
    }

    // Verificar inmediatamente
    this.verificarCitasInminentes();

    // Configurar verificación cada minuto
    this.temporizadorCitasInminentes = interval(240000).subscribe(() => {
      this.verificarCitasInminentes();
    });
  }
  private esRegistrado(cita: any): boolean {
    // Si tiene la marca explícita, la usamos
    if (cita.hasOwnProperty('isRegistered')) {
      return cita.isRegistered !== false;
    }

    // Si no tiene marca, intentamos deducirlo por las propiedades
    // Las citas no registradas suelen tener ANRid en lugar de Aid
    if (cita.ANRid) {
      return false;
    }

    // Las citas registradas suelen tener número de documento o Aid
    if (cita.Aid || cita.id || cita.numero_documento) {
      return true;
    }

    // Por defecto, asumimos que es registrada
    return true;
  }

  // Verificar si hay citas a punto de comenzar
  private verificarCitasInminentes(): void {
    // Si no hay citas hoy, no necesitamos verificar
    if (!this.citasDeHoyCache.length) {
      this.citaInminenteSubject.next(null);
      return;
    }

    const ahora = new Date();
    let citaMasInminente = null;
    let menorTiempoHastaCita = Infinity;

    // Buscar la cita más próxima entre todas las de hoy
    for (const cita of this.citasDeHoyCache) {
      try {
        const horaCita = this.obtenerHoraCita(cita);
        if (!horaCita) continue;

        const [horas, minutos] = horaCita.split(':').map(Number);
        const fechaCita = this.obtenerFechaCita(cita);
        if (!fechaCita) continue;

        const fechaHoraCita = new Date(fechaCita);
        fechaHoraCita.setHours(horas, minutos);

        // Calcular minutos hasta la cita
        const minutosHasta = Math.floor(
          (fechaHoraCita.getTime() - ahora.getTime()) / 60000
        );

        // Si es una cita futura y es la más cercana hasta ahora
        if (minutosHasta > 0 && minutosHasta < menorTiempoHastaCita) {
          menorTiempoHastaCita = minutosHasta;
          citaMasInminente = {
            ...cita,
            minutosRestantes: minutosHasta,
            nombrePaciente: this.obtenerNombrePaciente(cita),
          };
        }
      } catch (error) {
        console.error('Error al verificar cita:', error);
      }
    }

    // Si encontramos una cita inminente (menos de 15 minutos)
    if (citaMasInminente && citaMasInminente.minutosRestantes <= 15) {
      // Evitar mostrar la misma notificación repetidamente
      const citaAnterior = this.citaInminenteSubject.getValue();
      const mismoId =
        citaAnterior &&
        (citaAnterior.id === citaMasInminente.id ||
          citaAnterior.Aid === citaMasInminente.Aid ||
          citaAnterior.ANRid === citaMasInminente.ANRid);

      // Si es una cita diferente o no había una cita antes
      if (!mismoId) {
        console.log(
          `¡ATENCIÓN! Cita inminente en ${citaMasInminente.minutosRestantes} minutos para ${citaMasInminente.nombrePaciente}`
        );

        // Actualizar el estado
        this.citaInminenteSubject.next(citaMasInminente);

        // Mostrar notificación
        this.notificacionService.info(
          `Cita inminente en ${citaMasInminente.minutosRestantes} minutos con ${citaMasInminente.nombrePaciente}`
        );
      }
    } else {
      // No hay citas inminentes
      this.citaInminenteSubject.next(null);
    }
  }

  // Métodos auxiliares para manejar diferentes formatos de datos
  private normalizarEstado(cita: any): string {
    const estado = (cita.estado || cita.status || '').toLowerCase();
    return estado;
  }

  private obtenerFechaCita(cita: any): Date | null {
    try {
      const fechaStr = cita.fecha_cita || cita.fecha || cita.date;
      if (!fechaStr) {
        console.debug('Cita sin fecha definida:', cita.id || cita.Aid || cita.ANRid);
        return null;
      }
  
      let fecha: Date;
      
      // ENFOQUE MEJORADO: Normalizar todas las fechas de manera consistente
      if (typeof fechaStr === 'string') {
        // Si es un string, procesar según su formato
        if (fechaStr.includes('T')) {
          const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
          fecha = new Date(year, month - 1, day, 12, 0, 0); // 12:00 PM
        } else if (fechaStr.includes('-')) {
          // Formato YYYY-MM-DD sin la T
          const [year, month, day] = fechaStr.split('-').map(Number);
          fecha = new Date(year, month - 1, day, 12, 0, 0); // 12:00 PM
        } else if (fechaStr.includes('/')) {
          // Formato MM/DD/YYYY o DD/MM/YYYY
          const parts = fechaStr.split('/').map(Number);
          
          // Determinar el formato (asumiendo MM/DD/YYYY si el primer número es ≤ 12)
          if (parts[0] <= 12) {
            fecha = new Date(parts[2], parts[0] - 1, parts[1], 12, 0, 0);
          } else {
            fecha = new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
          }
        } else {
          // Último recurso: usar el constructor de Date pero luego normalizarlo
          fecha = new Date(fechaStr);
          // Normalizar a medio día para evitar problemas de zona horaria
          fecha = new Date(
            fecha.getFullYear(), 
            fecha.getMonth(), 
            fecha.getDate(), 
            12, 0, 0
          );
        }
      } else if (fechaStr instanceof Date) {
        // Si ya es un objeto Date, normalizarlo a medio día
        fecha = new Date(
          fechaStr.getFullYear(),
          fechaStr.getMonth(),
          fechaStr.getDate(),
          12, 0, 0
        );
      } else {
        // No es un formato reconocido
        console.warn('Formato de fecha no reconocido:', fechaStr);
        return null;
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida después de normalizar:', fechaStr);
        return null;
      }
  
      // Log para depuración
      const isRegistered = cita.isRegistered !== false;
      console.debug(
        `Fecha normalizada: ${fecha.toLocaleDateString()} (${fecha.toISOString()}) en cita ${
          isRegistered ? 'registrada' : 'no registrada'
        }`
      );
  
      return fecha;
    } catch (e) {
      console.error('Error procesando fecha:', e, 'en cita:', cita);
      return null;
    }
  }

  // En el método obtenerHoraCita()
  private obtenerHoraCita(cita: any): string | null {
    const hora = cita.hora_cita || cita.hora || cita.time || null;
    if (hora) {
      console.debug(
        `Hora encontrada: ${hora} en cita ${cita.id || cita.Aid || cita.ANRid}`
      );
    }
    return hora;
  }

  private sonMismoDia(fecha1: Date, fecha2: Date): boolean {
    // Verificar que ambos parámetros sean fechas válidas
    if (!(fecha1 instanceof Date) || !(fecha2 instanceof Date) || 
        isNaN(fecha1.getTime()) || isNaN(fecha2.getTime())) {
      console.warn('sonMismoDia recibió fechas inválidas:', fecha1, fecha2);
      return false;
    }
    
    // Comparación solo de año/mes/día
    const resultado = (
      fecha1.getFullYear() === fecha2.getFullYear() &&
      fecha1.getMonth() === fecha2.getMonth() &&
      fecha1.getDate() === fecha2.getDate()
    );
    
    // Log para depuración
    if (resultado) {
      console.debug(`Fechas coinciden como mismo día: ${fecha1.toLocaleDateString()} = ${fecha2.toLocaleDateString()}`);
    }
    
    return resultado;
  }

  private obtenerNombrePaciente(cita: any): string {
    // Caso 1: Si hay patientName directo
    if (cita.patientName) return cita.patientName;

    // Caso 2: Si tiene nombre y apellidos como propiedades separadas
    if (cita.nombre) {
      const apellido = cita.apellidos || cita.apellido || '';
      return `${cita.nombre} ${apellido}`.trim();
    }

    // Caso 3: Si tiene nombre_paciente
    if (cita.nombre_paciente) {
      const apellido = cita.apellidos_paciente || '';
      return `${cita.nombre_paciente} ${apellido}`.trim();
    }

    // Si no encontramos nombre
    return 'Paciente';
  }

  // Métodos públicos para interactuar con el servicio

  // Mostrar u ocultar notificaciones manualmente
  public mostrarNotificacion(): void {
    // Solo mostrar si hay citas pendientes
    if (this.tieneCitasPendientes) {
      this.notificacionHaSidoSolicitada = true;
      this.showNotificationSubject.next(true);
    }
  }

  public ocultarNotificacion(): void {
    this.showNotificationSubject.next(false);
    this.notificacionHaSidoSolicitada = false;
  }
  public updateWithExistingCitas(citas: any[]): void {
    this.procesarCitas(citas);
  }

  // Método alias para mantener compatibilidad con componentes en inglés
  public hideNotification(): void {
    // Delega al método en español
    this.ocultarNotificacion();
  }

  // Reiniciar notificaciones (por ejemplo, cuando el usuario cierra sesión)
  public reiniciarNotificaciones(): void {
    this.notificacionYaMostrada = false;
  }

  // Forzar actualización manual
  public actualizarCitas(forzarRecarga: boolean = false): void {
    if (forzarRecarga) {
      console.log('Forzando recarga desde el servidor...');
      this.limpiarCache();
    }
    this.cargarTodasLasCitas();
  }
  public actualizarCacheConCita(citaModificada: any): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return;

      const cacheData = JSON.parse(cached);
      let citas = cacheData.data;

      // Si la cita ya existe, actualizarla
      const citaIndex = citas.findIndex(
        (c: any) =>
          c.id === citaModificada.id ||
          c.Aid === citaModificada.Aid ||
          c.ANRid === citaModificada.ANRid
      );

      if (citaIndex >= 0) {
        citas[citaIndex] = citaModificada;
      } else {
        // Si es una cita nueva, añadirla
        citas.push(citaModificada);
      }

      // Actualizar la caché
      cacheData.data = citas;
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));

      // Re-procesar las citas actualizadas
      this.procesarCitas(citas);

      console.log('✓ Caché actualizada después de modificación');
    } catch (e) {
      console.error('Error actualizando caché con cita modificada:', e);
    }
  }
  // Liberar recursos al destruir el servicio
  public destruir(): void {
    if (this.temporizadorCitasInminentes) {
      this.temporizadorCitasInminentes.unsubscribe();
    }
    if (this.temporizadorRefresh) {
      this.temporizadorRefresh.unsubscribe();
    }
  }
}
