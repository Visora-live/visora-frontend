import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { CurrentUser, LoginRequest, TokenResponse } from '../models/auth.model';

// Non-sensitive flag only — the actual JWT lives in a httpOnly cookie (JS-inaccessible).
const LOGGED_IN_KEY = 'visora_logged_in';
const ADMIN_ROLES = new Set(['admin', 'administrador', 'administrator']);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  private userCache$: Observable<CurrentUser | null> | null = null;

  login(usernameOrEmail: string, password: string) {
    const body: LoginRequest = { username_or_email: usernameOrEmail, password };
    return this.http.post<TokenResponse>(`${this.base}/auth/login`, body, { withCredentials: true }).pipe(
      tap(() => {
        localStorage.setItem(LOGGED_IN_KEY, '1');
        this.userCache$ = null;
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(LOGGED_IN_KEY);
    this.userCache$ = null;
    // Clear httpOnly cookie server-side; fire-and-forget
    this.http.post(`${this.base}/auth/logout`, {}, { withCredentials: true }).subscribe();
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(LOGGED_IN_KEY) !== null;
  }

  getCurrentUser(): Observable<CurrentUser | null> {
    if (!this.isLoggedIn()) return of(null);
    if (!this.userCache$) {
      this.userCache$ = this.http.get<CurrentUser>(`${this.base}/auth/me`, { withCredentials: true }).pipe(
        catchError((err: HttpErrorResponse) => {
          this.userCache$ = null;
          if (err.status === 401 || err.status === 403) this.logout();
          return of(null);
        }),
        shareReplay(1),
      );
    }
    return this.userCache$;
  }

  isAdminRole(roleName: string | null | undefined): boolean {
    return ADMIN_ROLES.has((roleName ?? '').trim().toLowerCase());
  }
}
