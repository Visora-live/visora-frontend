import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { take, interval, Subscription, switchMap, startWith } from 'rxjs';
import type { VisoraEvent } from '../../../core/models/event.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../core/services/auth.service';
import { CameraService } from '../../../core/services/camera.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { HlsPlayerComponent } from '../../../shared/components/hls-player/hls-player';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-camera-detail',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    ConfirmDialogComponent,
    HlsPlayerComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './camera-detail.html',
  styleUrl: './camera-detail.scss',
})
export class CameraDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly cameraService = inject(CameraService);

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));

  protected readonly cameraId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly hlsUrl      = `${environment.mediamtxHlsBase}/cam${this.cameraId}_view/index.m3u8`;
  protected readonly rtmpPushUrl = `${environment.mediamtxRtmpUrl}/cam${this.cameraId}`;

  protected readonly camera = toSignal(this.cameraService.getById(this.cameraId), {
    initialValue: null,
  });

  protected readonly recentEvents = signal<VisoraEvent[]>([]);

  protected cameraStatusToBadge(status: CameraStatus): BadgeStatus {
    return status === 'online' ? 'normal' : 'inactive';
  }

  protected cameraStatusLabel(status: CameraStatus): string {
    return status === 'online' ? 'En línea' : 'Sin señal';
  }

  protected copyToClipboard(url: string): void {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  // ── Delete camera with confirmation ───────────────────────────────────────
  protected readonly confirmingDelete = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly deleteError = signal('');

  protected requestDelete(): void {
    this.deleteError.set('');
    this.confirmingDelete.set(true);
  }

  protected cancelDelete(): void {
    if (this.isDeleting()) return;
    this.confirmingDelete.set(false);
  }

  protected confirmDelete(): void {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);
    this.deleteError.set('');
    this.cameraService
      .delete(this.cameraId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.confirmingDelete.set(false);
          void this.router.navigate([this.isAdmin() ? '/cameras' : '/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.isDeleting.set(false);
          this.deleteError.set(
            err.status === 403
              ? 'No tienes permisos para eliminar esta cámara.'
              : err.status === 404
                ? 'La cámara ya no existe.'
                : 'No se pudo eliminar la cámara. Intenta de nuevo.',
          );
        },
      });
  }

  // ── Detección armas ───────────────────────────────────────────────────────
  protected readonly detectionRunning = signal(false);
  protected readonly detectionLoading = signal(false);
  private _detectionSub: Subscription | null = null;
  private _eventPollSub: Subscription | null = null;

  ngOnInit(): void {
    this.cameraService
      .getRecentEvents(this.cameraId, 5)
      .pipe(take(1))
      .subscribe((events) => this.recentEvents.set(events));

    this.cameraService
      .getDetectionStatus(this.cameraId)
      .pipe(take(1))
      .subscribe((s) => {
        this.detectionRunning.set(s.running);
        if (s.running) this._startEventPolling();
      });
  }

  ngOnDestroy(): void {
    this._detectionSub?.unsubscribe();
    this._eventPollSub?.unsubscribe();
  }

  protected toggleDetection(): void {
    if (this.detectionLoading()) return;
    this.detectionLoading.set(true);
    const action$ = this.detectionRunning()
      ? this.cameraService.stopDetection(this.cameraId)
      : this.cameraService.startDetection(this.cameraId);

    this._detectionSub = action$.pipe(take(1)).subscribe({
      next: (res) => {
        this.detectionRunning.set(res.running);
        this.detectionLoading.set(false);
        if (res.running) this._startEventPolling();
        else this._stopEventPolling();
      },
      error: () => this.detectionLoading.set(false),
    });
  }

  private _startEventPolling(): void {
    this._stopEventPolling();
    this._eventPollSub = interval(2000)
      .pipe(
        startWith(0),
        switchMap(() => this.cameraService.getRecentEvents(this.cameraId, 5)),
      )
      .subscribe((events) => this.recentEvents.set(events));
  }

  private _stopEventPolling(): void {
    this._eventPollSub?.unsubscribe();
    this._eventPollSub = null;
  }
}
