import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
 // Mapa para almacenar datos en memoria durante la sesión actual
 private memoryCache: Map<string, {data: any, expiry: number}> = new Map();

 constructor() { 
   // Cargar datos de localStorage al inicio
   this.loadFromStorage();
 }

 /**
  * Guarda datos en caché (memoria y localStorage)
  * @param key Clave única para el recurso
  * @param data Los datos a guardar
  * @param ttl Tiempo de vida en minutos (por defecto 30 minutos)
  */
 set(key: string, data: any, ttl: number = 30): void {
   const expiry = Date.now() + (ttl * 60 * 1000);
   
   // Guardar en memoria
   this.memoryCache.set(key, { data, expiry });
   
   // Guardar en localStorage para persistencia
   try {
     const storageItem = {
       data,
       expiry
     };
     localStorage.setItem(`cache_${key}`, JSON.stringify(storageItem));
   } catch (e) {
     console.warn('Error guardando en localStorage (posiblemente memoria llena):', e);
   }
 }

 /**
  * Obtiene datos de la caché
  * @param key Clave del recurso
  * @returns Los datos o null si no existen o están expirados
  */
 get<T>(key: string): T | null {
   const item = this.memoryCache.get(key);
   
   // Verificar si existe y no ha expirado
   if (item && item.expiry > Date.now()) {
     return item.data as T;
   }
   
   // Si no está en memoria o expiró, intentar desde localStorage
   try {
     const stored = localStorage.getItem(`cache_${key}`);
     if (stored) {
       const parsedItem = JSON.parse(stored);
       
       if (parsedItem.expiry > Date.now()) {
         // Restaurar a memoria si sigue siendo válido
         this.memoryCache.set(key, parsedItem);
         return parsedItem.data as T;
       } else {
         // Eliminar si expiró
         this.remove(key);
       }
     }
   } catch (e) {
     console.warn('Error recuperando de caché:', e);
   }
   
   return null;
 }

 /**
  * Verifica si un elemento está en caché y es válido
  */
 has(key: string): boolean {
   return this.get(key) !== null;
 }

 /**
  * Elimina un elemento específico de la caché
  */
 remove(key: string): void {
   this.memoryCache.delete(key);
   localStorage.removeItem(`cache_${key}`);
 }

 /**
  * Limpia toda la caché
  */
 clear(): void {
   this.memoryCache.clear();
   
   // Eliminar solo entradas de caché en localStorage
   Object.keys(localStorage)
     .filter(key => key.startsWith('cache_'))
     .forEach(key => localStorage.removeItem(key));
 }

 /**
  * Cargar datos de localStorage a memoria al iniciar
  */
 private loadFromStorage(): void {
   try {
     Object.keys(localStorage)
       .filter(key => key.startsWith('cache_'))
       .forEach(key => {
         const raw = localStorage.getItem(key);
         if (raw) {
           const parsed = JSON.parse(raw);
           // Solo cargar si no ha expirado
           if (parsed.expiry > Date.now()) {
             const realKey = key.replace('cache_', '');
             this.memoryCache.set(realKey, parsed);
           } else {
             // Eliminar si ya expiró
             localStorage.removeItem(key);
           }
         }
       });
   } catch (e) {
     console.warn('Error cargando caché desde localStorage:', e);
   }
 }
}