import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { BadgeStatus } from '../../shared/components/status-badge/status-badge';
import type { Camera, CameraStatus } from '../../core/models/camera.model';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { CameraService } from '../../core/services/camera.service';
import { StoreService } from '../../core/services/store.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { HlsPlayerComponent } from '../../shared/components/hls-player/hls-player';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { environment } from '../../../environments/environment';

const EMPTY_CAM_LIST = { items: [], total: 0, onlineCount: 0, offlineCount: 0, errorCount: 0 };
const EMPTY_STORE_LIST = { items: [], total: 0 };
const NO_LOCATION = 'Sin ubicación';

interface MonitorCamera extends Camera {
  locationLabel: string;
}

interface CameraGroup {
  location: string;
  cameras: MonitorCamera[];
}

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    EmptyStateComponent,
    HlsPlayerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private readonly cameraService = inject(CameraService);
  private readonly storeService = inject(StoreService);

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));
  protected readonly dashSubtitle = computed(() =>
    this.isAdmin()
      ? 'Resumen operativo del sistema de videovigilancia VISORA.'
      : 'Monitoreo en vivo de las cámaras de tus tiendas, organizadas por ubicación.',
  );

  // ── Admin summary data ──────────────────────────────────────────────────
  private readonly data = toSignal(this.service.getAll(5), { initialValue: null });

  protected readonly recentAlerts = computed(() => this.data()?.recentAlerts ?? []);
  protected readonly recentEvents = computed(() => this.data()?.recentEvents ?? []);

  // ── Propietario camera monitor ──────────────────────────────────────────
  private readonly camListRes = toSignal(this.cameraService.list(), { initialValue: EMPTY_CAM_LIST });
  private readonly storeListRes = toSignal(this.storeService.list(), { initialValue: EMPTY_STORE_LIST });

  private readonly storeMap = computed(() => {
    const m = new Map<string, string>();
    this.storeListRes().items.forEach((s) => m.set(s.id, s.name));
    return m;
  });

  protected readonly cameras = computed<MonitorCamera[]>(() =>
    this.camListRes().items.map((c) => ({
      ...c,
      storeName: this.storeMap().get(c.storeId) ?? c.storeName,
      locationLabel: c.location?.trim() ? c.location.trim() : NO_LOCATION,
    })),
  );

  protected readonly camOnlineCount = computed(() => this.camListRes().onlineCount);
  protected readonly camOfflineCount = computed(
    () => this.camListRes().offlineCount + this.camListRes().errorCount,
  );

  protected readonly locationFilter = signal<string>('all');
  protected readonly storeFilter = signal<string>('all');

  protected readonly hasMultipleStores = computed(() => this.storeOptions().length > 1);

  protected readonly storeOptions = computed(() =>
    this.storeListRes().items
      .map((s) => ({ id: s.id, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  protected readonly locationOptions = computed(() =>
    Array.from(new Set(this.cameras().map((c) => c.locationLabel))).sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  private readonly filteredCameras = computed(() => {
    const loc = this.locationFilter();
    const store = this.storeFilter();
    return this.cameras().filter((c) => {
      if (loc !== 'all' && c.locationLabel !== loc) return false;
      if (store !== 'all' && c.storeId !== store) return false;
      return true;
    });
  });

  /** Cameras grouped by location/zone, each group sorted by name. */
  protected readonly groupedCameras = computed<CameraGroup[]>(() => {
    const groups = new Map<string, MonitorCamera[]>();
    for (const cam of this.filteredCameras()) {
      const key = cam.locationLabel;
      const bucket = groups.get(key) ?? [];
      bucket.push(cam);
      groups.set(key, bucket);
    }
    return Array.from(groups.entries())
      .map(([location, cams]) => ({
        location,
        cameras: [...cams].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.location.localeCompare(b.location));
  });

  protected readonly isCamFiltered = computed(
    () => this.locationFilter() !== 'all' || this.storeFilter() !== 'all',
  );

  protected readonly visibleCamCount = computed(() => this.filteredCameras().length);
  protected readonly totalCamCount = computed(() => this.cameras().length);

  protected clearCamFilters(): void {
    this.locationFilter.set('all');
    this.storeFilter.set('all');
  }

  // ── Shared helpers ──────────────────────────────────────────────────────
  protected severityBadge(severity: string): BadgeStatus {
    const map: Record<string, BadgeStatus> = {
      critical: 'critical',
      suspicious: 'suspicious',
      normal: 'normal',
    };
    return map[severity] ?? 'normal';
  }

  /** HLS stream URL for a camera (MediaMTX path = cam<id>). */
  protected hlsUrl(cameraId: string): string {
    return `${environment.mediamtxHlsBase}/cam${cameraId}/index.m3u8`;
  }

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
