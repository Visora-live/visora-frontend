import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { take, interval, Subscription, switchMap, startWith } from 'rxjs';
import type { VisoraEvent } from '../../../core/models/event.model';
import type { Alert } from '../../../core/models/alert.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
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
  private readonly alertService = inject(AlertService);

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));

  protected readonly cameraId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly hlsUrl      = `${environment.mediamtxHlsBase}/cam${this.cameraId}_low/index.m3u8`;
  protected readonly rtmpPushUrl = `${environment.mediamtxRtmpUrl}/cam${this.cameraId}`;

  protected readonly camera = toSignal(this.cameraService.getById(this.cameraId), {
    initialValue: null,
  });

  protected readonly recentEvents = signal<VisoraEvent[]>([]);

  // ── Alert toasts (bottom-right, on new alert for this camera) ─────────────
  protected readonly toasts = signal<{ id: string; createdAt: string; message: string }[]>([]);
  private readonly _seenAlertIds = new Set<string>();
  private readonly _pageOpenedAt = new Date();
  private _alertPollSub: Subscription | null = null;

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

    this._startAlertPolling();
    document.addEventListener('click', this._unlockAudio);
    document.addEventListener('keydown', this._unlockAudio);
  }

  ngOnDestroy(): void {
    this._detectionSub?.unsubscribe();
    this._eventPollSub?.unsubscribe();
    this._alertPollSub?.unsubscribe();
    document.removeEventListener('click', this._unlockAudio);
    document.removeEventListener('keydown', this._unlockAudio);
    this._audioCtx?.close().catch(() => {});
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

  // ── Alert toasts ───────────────────────────────────────────────────────────
  private _startAlertPolling(): void {
    this._alertPollSub = interval(3000)
      .pipe(startWith(0), switchMap(() => this.alertService.listByCamera(this.cameraId)))
      .subscribe((alerts) => this._onAlertsPolled(alerts));
  }

  private _onAlertsPolled(alerts: Alert[]): void {
    for (const a of alerts) {
      if (this._seenAlertIds.has(a.id)) continue;
      this._seenAlertIds.add(a.id);
      // Compare by timestamp, not "which poll cycle first saw it" — an alert
      // created a moment before the page loaded could still land in the very
      // first response if backend + polling timing race, and would otherwise
      // get silently swallowed into the baseline instead of toasting.
      if (new Date(a.createdAt) > this._pageOpenedAt) this._pushToast(a);
    }
  }

  private _pushToast(a: Alert): void {
    const identified = a.description.includes('Portador:');
    const toast = {
      id: a.id,
      createdAt: a.createdAt,
      message: identified ? 'Arma e infractor detectado' : 'Arma detectada',
    };
    this.toasts.update((list) => [...list, toast]);
    this._playAlertSound();
    setTimeout(() => this.dismissToast(toast.id), 8000);
  }

  // ── Alert sound ────────────────────────────────────────────────────────────
  private _audioCtx: AudioContext | null = null;

  private _getAudioCtx(): AudioContext | null {
    if (this._audioCtx) return this._audioCtx;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this._audioCtx = new Ctx();
      return this._audioCtx;
    } catch {
      return null;
    }
  }

  /** Unlocks the AudioContext on first real user interaction (autoplay policy). */
  private readonly _unlockAudio = (): void => {
    this._getAudioCtx()?.resume().catch(() => {});
  };

  /** Two-tone beep synthesized with Web Audio — no audio file to host/deploy. */
  private _playAlertSound(): void {
    const ctx = this._getAudioCtx();
    if (!ctx) return;

    const doBeep = () => {
      const beep = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration + 0.05);
      };
      beep(880, 0, 0.18);
      beep(660, 0.2, 0.18);
      beep(880, 0.4, 0.18);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(doBeep).catch(() => {});
    } else {
      doBeep();
    }
  }

  protected dismissToast(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
