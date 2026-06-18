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
  role: UserRole;       // derived from roleName via heuristic (contains 'admin'/'oper'/fallback 'viewer')
  roleId?: number;     // backend rol_id — always set on backend data, absent on legacy mocks
  roleName?: string;   // backend role nombre — always set on backend data, absent on legacy mocks
  status: UserStatus;
  storeId?: string;
  storeName?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  lastAccess?: string;
  recentActivity: UserActivity[];
}
