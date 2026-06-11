import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { Store, StoreStatus } from '../models/store.model';
import { MOCK_STORES } from '../../features/stores/stores.mock';
import { MOCK_ALERTS } from '../../features/alerts/alerts.mock';
import { MOCK_EVENTS } from '../../features/events/events.mock';

export interface StoreListResponse {
  items: Store[];
  total: number;
}

export interface StoreMetrics {
  alertsOpen: number;
  alertsResolved: number;
  eventsTotal: number;
}

export interface StorePayload {
  name: string;
  address: string;
  city: string;
  status: StoreStatus;
  manager?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  list() {
    return of<StoreListResponse>({ items: MOCK_STORES, total: MOCK_STORES.length });
  }

  getById(id: string) {
    return of(MOCK_STORES.find((s) => s.id === id) ?? null);
  }

  create(payload: StorePayload) {
    const newStore: Store = {
      ...payload,
      id: `store-${String(MOCK_STORES.length + 1).padStart(3, '0')}`,
      cameraCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    return of(newStore).pipe(delay(300));
  }

  update(id: string, payload: StorePayload) {
    const existing = MOCK_STORES.find((s) => s.id === id);
    const updated: Store = {
      ...(existing ?? {
        id,
        cameraCount: 0,
        createdAt: '',
        name: '',
        address: '',
        city: '',
        status: 'active' as StoreStatus,
      }),
      ...payload,
    };
    return of(updated).pipe(delay(300));
  }

  getMetricsByStore(id: string) {
    const metrics: StoreMetrics = {
      alertsOpen: MOCK_ALERTS.filter((a) => a.storeId === id && a.status === 'open').length,
      alertsResolved: MOCK_ALERTS.filter((a) => a.storeId === id && a.status === 'resolved').length,
      eventsTotal: MOCK_EVENTS.filter((e) => e.storeId === id).length,
    };
    return of(metrics);
  }
}
