import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User, UserRole, UserStatus } from '../models/user.model';
import { RoleService } from './role.service';

interface BackendUser {
  id: number;
  username: string;
  email: string | null;
  estado: string;
  rol_id: number;
  created_at: string;
  updated_at: string;
}

function deriveUserRole(roleName: string): UserRole {
  const n = roleName.toLowerCase();
  if (n.includes('admin')) return 'admin';
  if (n.includes('oper')) return 'operator';
  return 'viewer';
}

function mapBackendUser(b: BackendUser, roleMap: Map<number, string>): User {
  const roleName = roleMap.get(b.rol_id) ?? '';
  return {
    id: String(b.id),
    fullName: b.username,
    email: b.email ?? '',
    role: deriveUserRole(roleName),
    roleId: b.rol_id,
    roleName,
    status: b.estado === 'activo' ? 'active' : 'inactive',
    createdAt: b.created_at.slice(0, 10),
    recentActivity: [], // backend has no activity log
  };
}

export interface UserListResponse {
  items: User[];
  total: number;
  activeCount: number;
  adminCount: number;
  operatorCount: number;
  inactiveCount: number;
}

export interface UserCreatePayload {
  fullName: string;
  email: string;
  roleId: number;
  password: string;
  status: UserStatus;
  storeId?: string;
  phone?: string;
  notes?: string;
}

export interface UserUpdatePayload {
  fullName?: string;
  email?: string;
  roleId?: number;
  status?: UserStatus;
  storeId?: string;
  phone?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly roleService = inject(RoleService);
  private readonly base = environment.apiBaseUrl;

  list() {
    return forkJoin([
      this.http.get<BackendUser[]>(`${this.base}/users`),
      this.roleService.list(),
    ]).pipe(
      map(([users, roles]) => {
        const roleMap = new Map(roles.map((r) => [r.id, r.name]));
        const items = users.map((u) => mapBackendUser(u, roleMap));
        return {
          items,
          total: items.length,
          activeCount: items.filter((u) => u.status === 'active').length,
          adminCount: items.filter((u) => u.role === 'admin').length,
          operatorCount: items.filter((u) => u.role === 'operator').length,
          inactiveCount: items.filter((u) => u.status === 'inactive').length,
        };
      }),
    );
  }

  getById(id: string) {
    return forkJoin([
      this.http.get<BackendUser>(`${this.base}/users/${id}`),
      this.roleService.list(),
    ]).pipe(
      map(([user, roles]) => {
        const roleMap = new Map(roles.map((r) => [r.id, r.name]));
        return mapBackendUser(user, roleMap);
      }),
      catchError(() => of(null)),
    );
  }

  create(payload: UserCreatePayload) {
    const body = {
      username: payload.fullName,
      email: payload.email || null,
      estado: payload.status === 'active' ? 'activo' : 'inactivo',
      rol_id: payload.roleId,
      password: payload.password,
    };
    return this.http.post<BackendUser>(`${this.base}/users`, body).pipe(
      map((u) => mapBackendUser(u, new Map())),
    );
  }

  update(id: string, payload: UserUpdatePayload) {
    const body: Record<string, unknown> = {};
    if (payload.fullName !== undefined) body['username'] = payload.fullName;
    if (payload.email !== undefined) body['email'] = payload.email || null;
    if (payload.status !== undefined) body['estado'] = payload.status === 'active' ? 'activo' : 'inactivo';
    if (payload.roleId !== undefined) body['rol_id'] = payload.roleId;
    return this.http.patch<BackendUser>(`${this.base}/users/${id}`, body).pipe(
      map((u) => mapBackendUser(u, new Map())),
    );
  }

  delete(id: string) {
    // Logical delete — backend sets estado to 'inactivo' and returns updated user
    return this.http.delete<BackendUser>(`${this.base}/users/${id}`).pipe(
      map((u) => mapBackendUser(u, new Map())),
    );
  }
}
