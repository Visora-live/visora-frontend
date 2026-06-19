import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CameraConnectionStatus, CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../core/services/auth.service';
import { CameraService } from '../../../core/services/camera.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-camera-detail',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './camera-detail.html',
  styleUrl: './camera-detail.scss',
})
export class CameraDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly cameraService = inject(CameraService);

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));

  protected readonly cameraId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly camera = toSignal(this.cameraService.getById(this.cameraId), {
    initialValue: null,
  });

  protected readonly recentEvents = toSignal(
    this.cameraService.getRecentEvents(this.cameraId, 5),
    { requireSync: true },
  );

  protected cameraStatusToBadge(status: CameraStatus): BadgeStatus {
    const m: Record<CameraStatus, BadgeStatus> = {
      online: 'normal',
      offline: 'inactive',
      error: 'critical',
      maintenance: 'suspicious',
    };
    return m[status];
  }

  protected cameraStatusLabel(status: CameraStatus): string {
    const m: Record<CameraStatus, string> = {
      online: 'En línea',
      offline: 'Sin señal',
      error: 'Error',
      maintenance: 'Mantenimiento',
    };
    return m[status];
  }

  // ── IP Webcam connection ──────────────────────────────────────────────────

  protected readonly connectionStatus = signal<CameraConnectionStatus | null>(null);
  protected readonly isTesting = signal(false);

  protected readonly connectionState = computed((): 'idle' | 'testing' | 'connected' | 'failed' => {
    if (this.isTesting()) return 'testing';
    const s = this.connectionStatus();
    if (!s) return 'idle';
    return s.reachable ? 'connected' : 'failed';
  });

  protected readonly hasLiveStream = computed(
    () => (this.connectionStatus()?.reachable ?? false) && !!this.connectionStatus()?.streamUrl,
  );

  protected readonly mainStreamUrl = computed(
    () => (this.hasLiveStream() ? (this.connectionStatus()?.streamUrl ?? '') : ''),
  );

  protected readonly expectedSnapshotUrl = computed(() => {
    const c = this.camera();
    return c ? `http://${c.ipUrl}:${c.port}/shot.jpg` : '';
  });

  protected readonly expectedStreamUrl = computed(() => {
    const c = this.camera();
    return c ? `http://${c.ipUrl}:${c.port}/video` : '';
  });

  protected testConnection(): void {
    if (this.isTesting()) return;
    this.isTesting.set(true);
    this.connectionStatus.set(null);
    this.cameraService.getCameraConnection(this.cameraId).pipe(take(1)).subscribe({
      next: (s) => {
        this.connectionStatus.set(s);
        this.isTesting.set(false);
      },
      error: () => { this.isTesting.set(false); },
    });
  }

  protected disconnectStream(): void {
    this.connectionStatus.set(null);
  }

  protected copyToClipboard(url: string): void {
    navigator.clipboard.writeText(url).catch(() => {});
  }
}
