import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardMetrics {
  activeStores: number;
  onlineCameras: number;
  offlineCameras: number;
  maintenanceCameras: number;
  openAlerts: number;
  criticalAlerts: number;
  suspiciousEvents: number;
  totalEvents: number;
}

export interface DashboardRecentAlert {
  id: string;
  title: string;
  severity: string;
  storeName: string;
  createdAt: string;
}

export interface DashboardRecentEvent {
  id: string;
  description: string;
  severity: string;
  cameraName: string;
  timestamp: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentAlerts: DashboardRecentAlert[];
  recentEvents: DashboardRecentEvent[];
}

interface BackendStore { id: number; nombre: string; estado: string; }
interface BackendCamera { id: number; nombre: string; estado: string; tienda_id: number; }
interface BackendAlert {
  id: number; titulo: string; severidad: string; estado: string;
  camara_id: number | null; tienda_id: number | null; created_at: string;
}
interface BackendEvent {
  id: number; tipo: string; severidad: string;
  comentario: string | null; camara_id: number; fecha_hora: string;
}

const EMPTY_DATA: DashboardData = {
  metrics: {
    activeStores: 0, onlineCameras: 0, offlineCameras: 0, maintenanceCameras: 0,
    openAlerts: 0, criticalAlerts: 0, suspiciousEvents: 0, totalEvents: 0,
  },
  recentAlerts: [],
  recentEvents: [],
};

function severityLabel(s: string): string {
  const n = s.toLowerCase();
  if (n === 'normal' || n === 'baja') return 'normal';
  if (n === 'alta' || n === 'critical' || n === 'critica') return 'critical';
  return 'suspicious'; // 'media' → suspicious
}

function isCritical(s: string): boolean {
  const n = s.toLowerCase();
  return n === 'alta' || n === 'critical' || n === 'critica';
}

function isSuspicious(s: string): boolean {
  const n = s.toLowerCase();
  return n === 'media' || n === 'suspicious';
}

function tipoLabel(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t.includes('facial') || t.includes('reconocimiento')) return 'Reconocimiento facial';
  if (t.includes('arma') || t.includes('weapon')) return 'Objeto crítico';
  if (t === 'system' || t === 'sistema') return 'Sistema';
  return 'Actividad sospechosa';
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getAll(recentLimit = 5) {
    return forkJoin([
      this.http.get<BackendStore[]>(`${this.base}/stores`).pipe(catchError(() => of([] as BackendStore[]))),
      this.http.get<BackendCamera[]>(`${this.base}/cameras`).pipe(catchError(() => of([] as BackendCamera[]))),
      this.http.get<BackendAlert[]>(`${this.base}/alerts`).pipe(catchError(() => of([] as BackendAlert[]))),
      this.http.get<BackendEvent[]>(`${this.base}/events`).pipe(catchError(() => of([] as BackendEvent[]))),
    ]).pipe(
      map(([stores, cameras, alerts, events]) => {
        const camMap = new Map(cameras.map((c) => [c.id, c]));
        const storeMap = new Map(stores.map((s) => [s.id, s.nombre]));

        const metrics: DashboardMetrics = {
          activeStores: stores.filter((s) => s.estado === 'activa').length,
          onlineCameras: cameras.filter((c) => c.estado === 'activa').length,
          offlineCameras: cameras.filter((c) => c.estado === 'inactiva').length,
          maintenanceCameras: cameras.filter((c) => c.estado !== 'activa' && c.estado !== 'inactiva').length,
          openAlerts: alerts.filter((a) => a.estado === 'abierta').length,
          criticalAlerts: alerts.filter((a) => a.estado === 'abierta' && isCritical(a.severidad)).length,
          suspiciousEvents: events.filter((e) => isSuspicious(e.severidad)).length,
          totalEvents: events.length,
        };

        const recentAlerts: DashboardRecentAlert[] = [...alerts]
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, recentLimit)
          .map((a) => {
            const cam = a.camara_id ? camMap.get(a.camara_id) : undefined;
            const storeId = a.tienda_id ?? cam?.tienda_id ?? null;
            return {
              id: String(a.id),
              title: a.titulo,
              severity: severityLabel(a.severidad),
              storeName: storeId ? (storeMap.get(storeId) ?? '') : '',
              createdAt: a.created_at,
            };
          });

        const recentEvents: DashboardRecentEvent[] = [...events]
          .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
          .slice(0, recentLimit)
          .map((e) => ({
            id: String(e.id),
            description: e.comentario?.trim() || tipoLabel(e.tipo),
            severity: severityLabel(e.severidad),
            cameraName: camMap.get(e.camara_id)?.nombre ?? `Cámara ${e.camara_id}`,
            timestamp: e.fecha_hora,
          }));

        return { metrics, recentAlerts, recentEvents } as DashboardData;
      }),
      catchError(() => of(EMPTY_DATA)),
    );
  }
}
