import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { MOCK_CAMERAS } from '../cameras.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

interface RecentEvent {
  description: string;
  severity: BadgeStatus;
  time: string;
}

@Component({
  selector: 'app-camera-detail',
  imports: [
    RouterLink,
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

  protected readonly recentEvents: RecentEvent[] = [
    { description: 'Persona detectada en zona restringida', severity: 'suspicious', time: 'Hace 8 min' },
    { description: 'Movimiento nocturno registrado', severity: 'critical', time: 'Hace 22 min' },
    { description: 'Reconocimiento facial completado', severity: 'normal', time: 'Hace 35 min' },
    { description: 'Sin actividad inusual', severity: 'normal', time: 'Hace 1 h' },
    { description: 'Aglomeración detectada', severity: 'suspicious', time: 'Hace 2 h' },
  ];

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
