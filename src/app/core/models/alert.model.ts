import type { EventSeverity, EventType, Evidence, RecommendedAction } from './event.model';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface AlertTimelineEntry {
  timestamp: string;
  action: string;
  actor: string;
  icon: string;
}

export interface Alert {
  id: string;
  eventId: string;
  eventType: EventType;
  cameraId: string;
  cameraName: string;
  storeId: string;
  storeName: string;
  location: string;
  severity: EventSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  assignedTo?: string;
  evidence: Evidence[];
  timeline: AlertTimelineEntry[];
  recommendedActions: RecommendedAction[];
}
