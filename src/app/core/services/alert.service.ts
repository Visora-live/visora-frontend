import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { Alert } from '../models/alert.model';
import { MOCK_ALERTS } from '../../features/alerts/alerts.mock';

export interface AlertListResponse {
  items: Alert[];
  total: number;
  openCount: number;
  criticalCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  list() {
    const response: AlertListResponse = {
      items: MOCK_ALERTS,
      total: MOCK_ALERTS.length,
      openCount: MOCK_ALERTS.filter((a) => a.status === 'open').length,
      criticalCount: MOCK_ALERTS.filter((a) => a.severity === 'critical').length,
      acknowledgedCount: MOCK_ALERTS.filter((a) => a.status === 'acknowledged').length,
      resolvedCount: MOCK_ALERTS.filter((a) => a.status === 'resolved').length,
    };
    return of(response).pipe(delay(300));
  }

  getById(id: string) {
    return of(MOCK_ALERTS.find((a) => a.id === id) ?? null).pipe(delay(300));
  }

  acknowledge(id: string, assignedTo?: string) {
    const alert = MOCK_ALERTS.find((a) => a.id === id);
    if (!alert) return of(null).pipe(delay(300));
    const updated: Alert = {
      ...alert,
      status: 'acknowledged',
      updatedAt: new Date().toISOString(),
      ...(assignedTo ? { assignedTo } : {}),
    };
    return of(updated).pipe(delay(300));
  }

  resolve(id: string) {
    const alert = MOCK_ALERTS.find((a) => a.id === id);
    if (!alert) return of(null).pipe(delay(300));
    const updated: Alert = {
      ...alert,
      status: 'resolved',
      updatedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
    };
    return of(updated).pipe(delay(300));
  }
}
