export type EventSeverity = 'normal' | 'suspicious' | 'critical';
export type EventType =
  | 'facial_recognition'
  | 'weapon_detection'
  | 'suspicious_activity'
  | 'system';
export type EventStatus = 'pending' | 'reviewed' | 'dismissed';

export interface DetectionData {
  confidence: number;
  personId?: string;
  personLabel?: string;
  objectType?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface Evidence {
  id: string;
  type: 'image' | 'video';
  label: string;
  durationSeconds?: number;
}

export interface RecommendedAction {
  label: string;
  icon: string;
  severity: EventSeverity;
}

export interface PersonIdentification {
  id: string;
  dni?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  edad?: number;
}

export interface VisoraEvent {
  id: string;
  cameraId: string;
  cameraName: string;
  storeId: string;
  storeName: string;
  location: string;
  severity: EventSeverity;
  type: EventType;
  status: EventStatus;
  description: string;
  timestamp: string;
  evidence: Evidence[];
  detection?: DetectionData;
  recommendedActions: RecommendedAction[];
  identifications: PersonIdentification[];
  alertId?: string;
  notes?: string;
  snapshotUrl?: string;
}
