import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { AuthImagePipe } from '../../../shared/pipes/auth-image.pipe';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { StoreContextService } from '../../../core/services/store-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { EventType } from '../../../core/models/event.model';
import type { Alert, AlertStatus } from '../../../core/models/alert.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { AlertService } from '../../../core/services/alert.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

// ── Alert quick-view dialog ───────────────────────────────────────────────────

@Component({
  selector: 'app-alert-preview-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule, RouterLink, AsyncPipe, DatePipe, AuthImagePipe],
  template: `
    <!-- Header -->
    <div class="adlg-header">
      <div class="adlg-date">
        <mat-icon>calendar_today</mat-icon>
        <span>{{ d.createdAt | date:'EEEE, d MMMM yyyy · HH:mm:ss' : '' : 'es' }}</span>
      </div>
      <button mat-icon-button class="adlg-close" (click)="ref.close()" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="adlg-content">
      @if (d.snapshotUrl) {
        <div class="adlg-snapshot">
          <div class="adlg-snapshot-label">
            <mat-icon>screenshot_monitor</mat-icon>
            <span>Frame del incidente</span>
          </div>
          @if (d.snapshotUrl | authImage | async; as snap) {
          <img [src]="snap" alt="Frame capturado en el incidente" class="adlg-snapshot-img" loading="lazy" />
        }
        </div>
      }

      <div class="adlg-alert-msg">
        <mat-icon class="adlg-warn-icon">warning_amber</mat-icon>
        <p class="adlg-warn-text">
          <strong>¡Se ha detectado un incidente!</strong><br />
          Por favor acercarse a la cámara <strong>{{ d.cameraName }}</strong>@if (d.storeName) { de <strong>{{ d.storeName }}</strong>} para atender la situación de inmediato.
        </p>
      </div>

      @if (d.eventType !== 'weapon_detection' && d.description && !d.description.includes('analizando')) {
        <p class="adlg-desc">{{ d.description }}</p>
      }

      @if (d.eventId) {
        <div class="adlg-actions-center">
          <a mat-flat-button [routerLink]="['/events', d.eventId]" (click)="ref.close()" class="adlg-event-btn">
            <mat-icon>open_in_new</mat-icon>
            Ver evento
          </a>
        </div>
      }
    </mat-dialog-content>
  `,
  styles: [`
    :host {
      display: flex; flex-direction: column;
      width: min(720px, 96vw);
    }

    .adlg-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 10px 0 16px; flex-shrink: 0; gap: 8px;
    }
    .adlg-date {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.78rem; font-weight: 600;
      color: var(--visora-text-muted, #6b7280);
      text-transform: capitalize;
    }
    .adlg-date mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .adlg-content {
      display: flex; flex-direction: column; gap: 12px;
      padding: 10px 16px 16px !important;
      overflow-y: auto;
    }

    /* Snapshot */
    .adlg-snapshot {
      border-radius: 10px; overflow: hidden;
      border: 1px solid rgba(0,0,0,0.12);
      background: #0a0a0f;
      display: flex; flex-direction: column;
      height: 46vh;
    }
    .adlg-snapshot-label {
      display: flex; align-items: center; gap: 7px; flex-shrink: 0;
      padding: 7px 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;
      color: rgba(255,255,255,0.5);
    }
    .adlg-snapshot-label mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--visora-accent, #2f88f5); }
    .adlg-snapshot-img {
      display: block; flex: 1; min-height: 0;
      width: 100%; height: 100%;
      object-fit: contain; object-position: center;
      background: #0a0a0f;
    }

    /* Warning message */
    .adlg-alert-msg {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; gap: 8px;
      background: var(--visora-status-critical-bg, #fee2e2);
      border: 1.5px solid var(--visora-status-critical, #dc2626);
      border-radius: 10px; padding: 14px 18px;
    }
    .adlg-warn-icon { font-size: 32px; width: 32px; height: 32px; color: var(--visora-status-critical, #dc2626); }
    .adlg-warn-text { margin: 0; line-height: 1.65; font-size: 0.9rem; color: #000; }
    .adlg-warn-text strong { color: #000; }

    /* Description */
    .adlg-desc {
      margin: 0; font-size: 0.8rem;
      color: var(--visora-text-muted, #6b7280);
      line-height: 1.5; padding: 8px 12px; text-align: center;
      background: var(--visora-bg, #f4f6f9);
      border: 1px solid var(--visora-border-color, #e5e7eb);
      border-radius: 8px;
    }

    /* Button */
    .adlg-actions-center { display: flex; justify-content: center; }
    .adlg-event-btn { min-width: 200px; }
  `],
})
export class AlertPreviewDialogComponent {
  protected readonly d   = inject<Alert>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<AlertPreviewDialogComponent>);
}

// ── Alert list ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-alert-list',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './alert-list.html',
  styleUrl: './alert-list.scss',
})
export class AlertListComponent {
  private readonly bp           = inject(BreakpointObserver);
  private readonly alertService = inject(AlertService);
  private readonly storeCtx     = inject(StoreContextService);
  private readonly dialog       = inject(MatDialog);

  private readonly isMobile = toSignal(
    this.bp.observe(['(max-width: 768px)']).pipe(map((s) => s.matches)),
    { initialValue: false },
  );

  // Poll every 5s so a new alert shows up without navigating away and back.
  private readonly listRes = toSignal(
    toObservable(this.storeCtx.activeStoreId).pipe(
      switchMap((id) => timer(0, 5000).pipe(switchMap(() => this.alertService.list(id)))),
    ),
    { initialValue: { items: [], total: 0, openCount: 0, acknowledgedCount: 0, resolvedCount: 0 } },
  );

  protected readonly alerts       = computed(() => this.listRes().items);

  protected readonly openCount         = computed(() => this.listRes().openCount);
  protected readonly acknowledgedCount = computed(() => this.listRes().acknowledgedCount);
  protected readonly resolvedCount     = computed(() => this.listRes().resolvedCount);

  protected readonly displayedColumns = computed<string[]>(() =>
    this.isMobile()
      ? ['createdAt', 'description', 'actions']
      : ['createdAt', 'store', 'camera', 'actions'],
  );

  protected openAlert(alert: Alert): void {
    if (!alert.leida) {
      this.alertService.markRead(alert.id).subscribe();
      alert.leida = true;
    }
    this.dialog.open(AlertPreviewDialogComponent, {
      data: alert,
      panelClass: 'visora-dialog',
      maxWidth: '100vw',
      autoFocus: false,
    });
  }

  protected statusLabel(s: AlertStatus): string {
    const m: Record<AlertStatus, string> = {
      open: 'Abierta',
      acknowledged: 'En revisión',
      resolved: 'Resuelta',
    };
    return m[s];
  }

  protected statusBadge(s: AlertStatus): BadgeStatus {
    return s === 'open' ? 'critical' : s === 'acknowledged' ? 'suspicious' : 'normal';
  }
}

