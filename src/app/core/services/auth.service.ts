import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginRequest, TokenResponse } from '../models/auth.model';

const TOKEN_KEY = 'visora_access_token';
const TOKEN_TYPE_KEY = 'visora_token_type';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  login(usernameOrEmail: string, password: string) {
    const body: LoginRequest = { username_or_email: usernameOrEmail, password };
    return this.http.post<TokenResponse>(`${this.base}/auth/login`, body).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        localStorage.setItem(TOKEN_TYPE_KEY, res.token_type);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}
