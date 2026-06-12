import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { User, UserRole, UserStatus } from '../models/user.model';
import { MOCK_USERS } from '../../features/users/users.mock';

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
  password?: string;
  role: UserRole;
  status: UserStatus;
  storeId?: string;
  storeName?: string;
  phone?: string;
  notes?: string;
}

export interface UserUpdatePayload {
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  storeId?: string;
  storeName?: string;
  phone?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  list() {
    const response: UserListResponse = {
      items: MOCK_USERS,
      total: MOCK_USERS.length,
      activeCount: MOCK_USERS.filter((u) => u.status === 'active').length,
      adminCount: MOCK_USERS.filter((u) => u.role === 'admin').length,
      operatorCount: MOCK_USERS.filter((u) => u.role === 'operator').length,
      inactiveCount: MOCK_USERS.filter((u) => u.status === 'inactive').length,
    };
    return of(response);
  }

  getById(id: string) {
    return of(MOCK_USERS.find((u) => u.id === id) ?? null);
  }

  create(payload: UserCreatePayload) {
    const newUser: User = {
      id: `usr-${String(MOCK_USERS.length + 1).padStart(3, '0')}`,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      storeId: payload.storeId,
      storeName: payload.storeName,
      phone: payload.phone,
      notes: payload.notes,
      createdAt: new Date().toISOString().slice(0, 10),
      recentActivity: [],
    };
    return of(newUser).pipe(delay(300));
  }

  update(id: string, payload: UserUpdatePayload) {
    const existing = MOCK_USERS.find((u) => u.id === id);
    const updated: User | null = existing ? { ...existing, ...payload } : null;
    return of(updated).pipe(delay(300));
  }
}
