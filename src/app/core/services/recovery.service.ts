import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, take } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecoveryRequestPayload {
  identificador: string;
  email: string;
  descripcion: string;
}

export interface RecoveryRequest {
  id: number;
  identificador: string;
  email: string;
  descripcion: string;
  leida: boolean;
  createdAt: string;
}

interface BackendRecoveryRequest {
  id: number;
  identificador: string;
  email: string;
  descripcion: string;
  leida: boolean;
  created_at: string;
}

function mapRequest(b: BackendRecoveryRequest): RecoveryRequest {
  return {
    id: b.id,
    identificador: b.identificador,
    email: b.email,
    descripcion: b.descripcion,
    leida: b.leida,
    createdAt: b.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class RecoveryService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Shared unread count for the admin sidebar badge. */
  readonly unread = signal(0);

  /**
   * Refresh the unread badge. Call ONLY from admin context — the endpoint is
   * admin-only and would 403 for other roles. Errors are swallowed silently.
   */
  refreshUnread(): void {
    this.unreadCount()
      .pipe(take(1))
      .subscribe({ next: (n) => this.unread.set(n), error: () => {} });
  }

  /** Public — used by /forgot-password (no auth). */
  create(payload: RecoveryRequestPayload) {
    return this.http.post<BackendRecoveryRequest>(`${this.base}/recovery-requests`, {
      identificador: payload.identificador,
      email: payload.email,
      descripcion: payload.descripcion,
    });
  }

  /** Admin — list all recovery requests (newest first). */
  list(onlyUnread = false) {
    const url = `${this.base}/recovery-requests${onlyUnread ? '?only_unread=true' : ''}`;
    return this.http.get<BackendRecoveryRequest[]>(url).pipe(map((arr) => arr.map(mapRequest)));
  }

  /** Admin — unread count for the sidebar badge. */
  unreadCount() {
    return this.http
      .get<{ count: number }>(`${this.base}/recovery-requests/unread-count`)
      .pipe(map((r) => r.count));
  }

  /** Admin — mark a request as read. */
  markRead(id: number) {
    return this.http
      .patch<BackendRecoveryRequest>(`${this.base}/recovery-requests/${id}`, { leida: true })
      .pipe(map(mapRequest));
  }
}
