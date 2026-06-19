export type StoreStatus = 'active' | 'inactive';

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;           // frontend-only; backend has no city field
  ruc?: string;
  status: StoreStatus;
  cameraCount: number;
  createdAt: string;
  manager?: string;       // frontend-only; backend has no manager field
  email?: string;         // frontend-only; backend has no email field
  phone?: string;         // frontend-only; backend has no phone field
  notes?: string;         // frontend-only; backend has no notes field
}
