export type CameraStatus = 'online' | 'offline' | 'error' | 'maintenance';

export interface Camera {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  location: string;
  ipUrl: string;
  port?: number;
  status: CameraStatus;
  createdAt: string;
}
