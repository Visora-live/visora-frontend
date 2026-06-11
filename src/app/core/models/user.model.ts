export type UserRole = 'admin' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'inactive';

export interface UserActivity {
  timestamp: string;
  action: string;
  icon: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  storeId?: string;
  storeName?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  lastAccess?: string;
  recentActivity: UserActivity[];
}
