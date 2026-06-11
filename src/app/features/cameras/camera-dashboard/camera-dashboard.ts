import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import type { CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { MOCK_CAMERAS } from '../cameras.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

type StatusFilter = 'all' | CameraStatus;

@Component({
  selector: 'app-camera-dashboard',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './camera-dashboard.html',
  styleUrl: './camera-dashboard.scss',
})
export class CameraDashboardComponent {
  private readonly bp = inject(BreakpointObserver);
  private readonly isMobile = toSignal(
    this.bp.observe('(max-width: 600px)'),
    { initialValue: { matches: false, breakpoints: {} } },
  );

  protected readonly cameras = signal(MOCK_CAMERAS);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly storeFilter = signal<string>('all');

  protected readonly onlineCount = computed(
    () => this.cameras().filter((c) => c.status === 'online').length,
  );
  protected readonly offlineCount = computed(
    () => this.cameras().filter((c) => c.status === 'offline').length,
  );
  protected readonly errorCount = computed(
    () =>
      this.cameras().filter((c) => c.status === 'error' || c.status === 'maintenance').length,
  );

  protected readonly storeOptions = computed(() => {
    const map = new Map<string, string>();
    this.cameras().forEach((c) => map.set(c.storeId, c.storeName));
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly filteredCameras = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.statusFilter();
    const store = this.storeFilter();
    return this.cameras().filter((c) => {
      if (st !== 'all' && c.status !== st) return false;
      if (store !== 'all' && c.storeId !== store) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.location.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  });

  protected readonly isFiltered = computed(
    () =>
      this.searchQuery().trim() !== '' ||
      this.statusFilter() !== 'all' ||
      this.storeFilter() !== 'all',
  );

  protected readonly compact = computed(() => this.isMobile().matches);

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.storeFilter.set('all');
  }

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
