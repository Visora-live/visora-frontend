import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
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
    UpperCasePipe,
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
  private readonly cameraService = inject(CameraService);

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
}
