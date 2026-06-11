import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { MOCK_CAMERAS } from '../cameras.mock';
import { MOCK_EVENTS } from '../../events/events.mock';
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

  protected readonly cameraId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly camera = MOCK_CAMERAS.find((c) => c.id === this.cameraId) ?? null;

  protected readonly recentEvents = MOCK_EVENTS
    .filter((e) => e.cameraId === this.cameraId)
    .slice(0, 5);

  protected cameraStatusToBadge(status: CameraStatus): BadgeStatus {
    const map: Record<CameraStatus, BadgeStatus> = {
      online: 'normal',
      offline: 'inactive',
      error: 'critical',
      maintenance: 'suspicious',
    };
    return map[status];
  }

  protected cameraStatusLabel(status: CameraStatus): string {
    const map: Record<CameraStatus, string> = {
      online: 'En línea',
      offline: 'Sin señal',
      error: 'Error',
      maintenance: 'Mantenimiento',
    };
    return map[status];
  }
}
