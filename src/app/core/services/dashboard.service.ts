import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_STORES } from '../../features/stores/stores.mock';
import { MOCK_CAMERAS } from '../../features/cameras/cameras.mock';
import { MOCK_ALERTS } from '../../features/alerts/alerts.mock';
import { MOCK_EVENTS } from '../../features/events/events.mock';

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

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getMetrics() {
    const metrics: DashboardMetrics = {
      activeStores: MOCK_STORES.filter((s) => s.status === 'active').length,
      onlineCameras: MOCK_CAMERAS.filter((c) => c.status === 'online').length,
      offlineCameras: MOCK_CAMERAS.filter((c) => c.status === 'offline').length,
      maintenanceCameras: MOCK_CAMERAS.filter((c) => c.status === 'maintenance').length,
      openAlerts: MOCK_ALERTS.filter((a) => a.status === 'open').length,
      criticalAlerts: MOCK_ALERTS.filter((a) => a.severity === 'critical' && a.status === 'open').length,
      suspiciousEvents: MOCK_EVENTS.filter((e) => e.severity === 'suspicious').length,
      totalEvents: MOCK_EVENTS.length,
    };
    return of(metrics).pipe(delay(300));
  }

  getRecentAlerts(limit = 5) {
    const items = [...MOCK_ALERTS]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
    return of(items).pipe(delay(300));
  }

  getRecentEvents(limit = 5) {
    const items = [...MOCK_EVENTS]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
    return of(items).pipe(delay(300));
  }
}
