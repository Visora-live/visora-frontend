export type CameraStatus = 'online' | 'offline' | 'error';

export interface Camera {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  streamUrl: string;
  status: CameraStatus;
  location: string;
  createdAt: string;
}
