import type { EventSeverity } from './event.model';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  eventId: string;
  storeId: string;
  storeName: string;
  cameraId: string;
  cameraName: string;
  severity: EventSeverity;
  status: AlertStatus;
  message: string;
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}
