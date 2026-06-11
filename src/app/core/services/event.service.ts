import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { VisoraEvent, EventStatus } from '../models/event.model';
import { MOCK_EVENTS } from '../../features/events/events.mock';

export interface EventListResponse {
  items: VisoraEvent[];
  total: number;
  todayCount: number;
  criticalCount: number;
  suspiciousCount: number;
  evidenceCount: number;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly today = new Date().toISOString().slice(0, 10);

  list() {
    const response: EventListResponse = {
      items: MOCK_EVENTS,
      total: MOCK_EVENTS.length,
      todayCount: MOCK_EVENTS.filter((e) => e.timestamp.startsWith(this.today)).length,
      criticalCount: MOCK_EVENTS.filter((e) => e.severity === 'critical').length,
      suspiciousCount: MOCK_EVENTS.filter((e) => e.severity === 'suspicious').length,
      evidenceCount: MOCK_EVENTS.reduce((acc, e) => acc + e.evidence.length, 0),
    };
    return of(response);
  }

  getById(id: string) {
    return of(MOCK_EVENTS.find((e) => e.id === id) ?? null);
  }

  updateStatus(id: string, status: EventStatus) {
    const event = MOCK_EVENTS.find((e) => e.id === id);
    const updated: VisoraEvent | null = event ? { ...event, status } : null;
    return of(updated).pipe(delay(300));
  }
}
