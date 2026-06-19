import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { CurrentUser, LoginRequest, TokenResponse } from '../models/auth.model';

const TOKEN_KEY = 'visora_access_token';
const TOKEN_TYPE_KEY = 'visora_token_type';
const ADMIN_ROLES = new Set(['admin', 'administrador', 'administrator']);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  private userCache$: Observable<CurrentUser | null> | null = null;

  login(usernameOrEmail: string, password: string) {
    const body: LoginRequest = { username_or_email: usernameOrEmail, password };
    return this.http.post<TokenResponse>(`${this.base}/auth/login`, body).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        localStorage.setItem(TOKEN_TYPE_KEY, res.token_type);
        this.userCache$ = null;
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);
    this.userCache$ = null;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  getCurrentUser(): Observable<CurrentUser | null> {
    if (!this.userCache$) {
      this.userCache$ = this.http.get<CurrentUser>(`${this.base}/auth/me`).pipe(
        catchError(() => of(null)),
        shareReplay(1),
      );
    }
    return this.userCache$;
  }

  isAdminRole(roleName: string | null | undefined): boolean {
    return ADMIN_ROLES.has((roleName ?? '').trim().toLowerCase());
  }
}
