import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User, UserRole, UserStatus } from '../models/user.model';
import { RoleService } from './role.service';

interface BackendUser {
  id: number;
  username: string;
  email: string | null;
  estado_acceso: boolean;
  rol_id: number;
  created_at: string;
  updated_at: string;
}

function deriveUserRole(roleTipo: string): UserRole {
  const t = roleTipo.toLowerCase();
  return t === 'admin' || t === 'administrador' ? 'admin' : 'propietario';
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
    status: b.estado_acceso ? 'active' : 'inactive',
    createdAt: b.created_at.slice(0, 10),
    recentActivity: [],
  };
}

export interface UserListResponse {
  items: User[];
  total: number;
  activeCount: number;
  adminCount: number;
  propietarioCount: number;
  inactiveCount: number;
}

export interface UserCreatePayload {
  fullName: string;
  email: string;
  roleId: number;
  password: string;
  status: UserStatus;
}

export interface UserUpdatePayload {
  fullName?: string;
  email?: string;
  roleId?: number;
  status?: UserStatus;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly roleService = inject(RoleService);
  private readonly base = environment.apiBaseUrl;

  list() {
    interface BackendStore { id: number; nombre: string; }
    return forkJoin([
      this.http.get<BackendUser[]>(`${this.base}/users`),
      this.roleService.list(),
    ]).pipe(
      switchMap(([users, roles]) => {
        const roleMap = new Map(roles.map((r) => [r.id, r.name]));
        const mapped = users.map((u) => mapBackendUser(u, roleMap));

        if (mapped.length === 0) {
          return of({ items: [], total: 0, activeCount: 0, adminCount: 0, propietarioCount: 0, inactiveCount: 0 });
        }

        const storeReqs = mapped.map((u) =>
          this.http
            .get<BackendStore[]>(`${this.base}/users/${u.id}/stores`)
            .pipe(catchError(() => of([] as BackendStore[])))
        );

        return forkJoin(storeReqs).pipe(
          map((storesList) => {
            storesList.forEach((stores, i) => {
              const names = stores.map((s) => s.nombre);
              mapped[i].storeNames = names;
              mapped[i].storeName = names.length ? names.join(', ') : undefined;
            });
            return {
              items: mapped,
              total: mapped.length,
              activeCount: mapped.filter((u) => u.status === 'active').length,
              adminCount: mapped.filter((u) => u.role === 'admin').length,
              propietarioCount: mapped.filter((u) => u.role === 'propietario').length,
              inactiveCount: mapped.filter((u) => u.status === 'inactive').length,
            };
          }),
        );
      }),
    );
  }

  getById(id: string) {
    interface BackendStore { id: number; nombre: string; }
    return forkJoin([
      this.http.get<BackendUser>(`${this.base}/users/${id}`),
      this.roleService.list(),
      this.http.get<BackendStore[]>(`${this.base}/users/${id}/stores`).pipe(catchError(() => of([] as BackendStore[]))),
    ]).pipe(
      map(([user, roles, stores]) => {
        const roleMap = new Map(roles.map((r) => [r.id, r.name]));
        const mapped = mapBackendUser(user, roleMap);
        const names = stores.map((s) => s.nombre);
        mapped.storeNames = names;
        mapped.storeName = names.length ? names.join(', ') : undefined;
        return mapped;
      }),
      catchError(() => of(null)),
    );
  }

  create(payload: UserCreatePayload) {
    const body = {
      username: payload.fullName,
      email: payload.email || null,
      estado_acceso: payload.status === 'active',
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
    if (payload.status !== undefined) body['estado_acceso'] = payload.status === 'active';
    if (payload.roleId !== undefined) body['rol_id'] = payload.roleId;
    if (payload.password) body['password'] = payload.password;
    return this.http.patch<BackendUser>(`${this.base}/users/${id}`, body).pipe(
      map((u) => mapBackendUser(u, new Map())),
    );
  }

  delete(id: string) {
    return this.http.delete<BackendUser>(`${this.base}/users/${id}`).pipe(
      map((u) => mapBackendUser(u, new Map())),
    );
  }
}
