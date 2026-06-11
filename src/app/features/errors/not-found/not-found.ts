import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <p class="error-logo" aria-label="VISORA">VISORA</p>
      <div class="error-icon-wrap" aria-hidden="true">
        <mat-icon class="error-icon">search_off</mat-icon>
      </div>
      <p class="error-code" aria-hidden="true">404</p>
      <h1 class="error-title">Página no encontrada</h1>
      <p class="error-desc">
        La ruta solicitada no existe en el sistema VISORA.
        Verifica la URL o regresa al inicio.
      </p>
      <a mat-flat-button routerLink="/dashboard" class="error-btn">
        <mat-icon>home</mat-icon>
        Ir al inicio
      </a>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .error-page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      background: var(--visora-bg);
      text-align: center;
    }

    .error-logo {
      font-size: 20px;
      font-weight: 800;
      color: var(--visora-primary);
      letter-spacing: 0.12em;
      margin: 0 0 48px;
    }

    .error-icon-wrap {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: rgba(220, 38, 38, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .error-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
      color: var(--visora-status-critical);
    }

    .error-code {
      font-size: 80px;
      font-weight: 800;
      color: var(--visora-border-color);
      line-height: 1;
      margin: 0 0 8px;
      letter-spacing: -2px;
    }

    .error-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--visora-text);
      margin: 0 0 12px;
    }

    .error-desc {
      font-size: 14px;
      color: var(--visora-text-muted);
      max-width: 360px;
      line-height: 1.6;
      margin: 0 0 32px;
    }

    .error-btn { gap: 6px; }
  `],
})
export class NotFoundComponent {}
