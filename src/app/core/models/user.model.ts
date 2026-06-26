export type UserRole = 'admin' | 'propietario';
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
  role: UserRole;      // derived from rol.tipo: 'admin' | 'propietario'
  roleId?: number;    // backend rol_id
  roleName?: string;  // backend rol.tipo value
  status: UserStatus;
  storeNames?: string[];
  notes?: string;
  createdAt: string;
  recentActivity: UserActivity[];
}
