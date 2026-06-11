export type EventSeverity = 'normal' | 'suspicious' | 'critical';

export interface Event {
  id: string;
  cameraId: string;
  cameraName: string;
  storeId: string;
  storeName: string;
  severity: EventSeverity;
  description: string;
  timestamp: string;
  thumbnailUrl?: string;
  evidenceIds: string[];
  alertId?: string;
}
