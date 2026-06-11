export type CameraStatus = 'online' | 'offline' | 'error' | 'maintenance';

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
  resolution: string;
  status: CameraStatus;
  capabilities: CameraCapabilities;
  lastEvent?: string;
  lastEventTime?: string;
  createdAt: string;
  notes?: string;
}
