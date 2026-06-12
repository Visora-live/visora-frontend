import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { Camera, CameraStatus, CameraCapabilities } from '../models/camera.model';
import { MOCK_CAMERAS } from '../../features/cameras/cameras.mock';
import { MOCK_EVENTS } from '../../features/events/events.mock';

export interface CameraListResponse {
  items: Camera[];
  total: number;
  onlineCount: number;
  offlineCount: number;
  errorCount: number;
}

export interface CameraPayload {
  name: string;
  storeId: string;
  storeName: string;
  location: string;
  ipUrl: string;
  resolution: string;
  status: CameraStatus;
  capabilities: CameraCapabilities;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class CameraService {
  list() {
    const response: CameraListResponse = {
      items: MOCK_CAMERAS,
      total: MOCK_CAMERAS.length,
      onlineCount: MOCK_CAMERAS.filter((c) => c.status === 'online').length,
      offlineCount: MOCK_CAMERAS.filter((c) => c.status === 'offline').length,
      errorCount: MOCK_CAMERAS.filter((c) => c.status === 'error' || c.status === 'maintenance').length,
    };
    return of(response);
  }

  getById(id: string) {
    return of(MOCK_CAMERAS.find((c) => c.id === id) ?? null);
  }

  create(payload: CameraPayload) {
    const newCamera: Camera = {
      ...payload,
      id: `cam-${String(MOCK_CAMERAS.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    return of(newCamera).pipe(delay(300));
  }

  update(id: string, payload: CameraPayload) {
    const existing = MOCK_CAMERAS.find((c) => c.id === id);
    const updated: Camera | null = existing ? { ...existing, ...payload } : null;
    return of(updated).pipe(delay(300));
  }

  getRecentEvents(cameraId: string, limit = 5) {
    const items = MOCK_EVENTS
      .filter((e) => e.cameraId === cameraId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
    return of(items);
  }
}
