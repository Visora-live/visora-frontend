export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId?: string;
  isActive: boolean;
  createdAt: string;
}
