export type CameraStatus = 'online' | 'offline' | 'error' | 'maintenance';

export interface CameraConnectionStatus {
  cameraId?: number;
  snapshotUrl: string;
  streamUrl: string;
  reachable: boolean;
  statusCode: number | null;
  contentType: string | null;
  message: string;
}

export interface CameraCapabilities {
  facialRecognition: boolean;
  weaponDetection: boolean;
  recording: boolean;
}

export interface Camera {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  location: string;
  ipUrl: string;
  port?: number;
  resolution: string;           // frontend-only; backend has no resolution field
  status: CameraStatus;
  capabilities: CameraCapabilities; // frontend-only; backend has no capabilities fields
  lastEvent?: string;
  lastEventTime?: string;
  createdAt: string;
  notes?: string;               // frontend-only; backend has no notes field
}
