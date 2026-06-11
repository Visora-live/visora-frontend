export type StoreStatus = 'active' | 'inactive';

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  status: StoreStatus;
  cameraCount: number;
  createdAt: string;
  manager?: string;
  email?: string;
  phone?: string;
  notes?: string;
}
