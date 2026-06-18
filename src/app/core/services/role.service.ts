import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

interface BackendRole {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface RolePayload {
  name: string;
  description?: string;
}

function mapBackendRole(b: BackendRole): Role {
  return { id: b.id, name: b.nombre, description: b.descripcion ?? '' };
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list() {
    return this.http.get<BackendRole[]>(`${this.base}/roles`).pipe(
      map((arr) => arr.map(mapBackendRole)),
    );
  }

  getById(id: number) {
    return this.http.get<BackendRole>(`${this.base}/roles/${id}`).pipe(
      map((b) => mapBackendRole(b)),
      catchError(() => of(null)),
    );
  }

  create(payload: RolePayload) {
    const body = { nombre: payload.name, descripcion: payload.description ?? null };
    return this.http.post<BackendRole>(`${this.base}/roles`, body).pipe(
      map((b) => mapBackendRole(b)),
    );
  }

  update(id: number, payload: Partial<RolePayload>) {
    const body: { nombre?: string; descripcion?: string | null } = {};
    if (payload.name !== undefined) body.nombre = payload.name;
    if (payload.description !== undefined) body.descripcion = payload.description ?? null;
    return this.http.patch<BackendRole>(`${this.base}/roles/${id}`, body).pipe(
      map((b) => mapBackendRole(b)),
    );
  }

  delete(id: number) {
    // Backend returns 409 if role has associated users — catchError returns null in that case
    return this.http.delete<BackendRole>(`${this.base}/roles/${id}`).pipe(
      map((b) => mapBackendRole(b)),
      catchError(() => of(null)),
    );
  }
}
