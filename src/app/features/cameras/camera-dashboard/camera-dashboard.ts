import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import type { Camera, CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../core/services/auth.service';
import { CameraService } from '../../../core/services/camera.service';
import { CameraConnectionStateService } from '../../../core/services/camera-connection-state.service';
import { StoreService } from '../../../core/services/store.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

type StatusFilter = 'all' | CameraStatus;

const EMPTY_CAM_LIST = { items: [], total: 0, onlineCount: 0, offlineCount: 0, errorCount: 0 };
const EMPTY_STORE_LIST = { items: [], total: 0 };

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
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './camera-dashboard.html',
  styleUrl: './camera-dashboard.scss',
})
export class CameraDashboardComponent {
  private readonly bp = inject(BreakpointObserver);
  private readonly auth = inject(AuthService);
  private readonly cameraService = inject(CameraService);
  private readonly connState = inject(CameraConnectionStateService);
  private readonly storeService = inject(StoreService);

  // LIVE preview only for the single actively-connected camera in this session.
  protected readonly previewFailed = signal<ReadonlySet<string>>(new Set());
  protected onPreviewError(id: string): void {
    this.previewFailed.update((s) => new Set(s).add(id));
  }
  protected isCameraLive(cameraId: string): boolean {
    return this.connState.isCameraConnected(cameraId) && !this.previewFailed().has(cameraId);
  }
  protected cameraStreamUrl(cameraId: string): string {
    return this.connState.getStreamUrl(cameraId);
  }

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));

  private readonly isMobile = toSignal(
    this.bp.observe('(max-width: 600px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  private readonly listRes = toSignal(this.cameraService.list(), { initialValue: EMPTY_CAM_LIST });
  private readonly storeListRes = toSignal(this.storeService.list(), { initialValue: EMPTY_STORE_LIST });

  private readonly storeMap = computed(() => {
    const m = new Map<string, string>();
    this.storeListRes().items.forEach((s) => m.set(s.id, s.name));
    return m;
  });

  private readonly removedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly cameras = computed(() =>
    this.listRes()
      .items.filter((c) => !this.removedIds().has(c.id))
      .map((c) => ({
        ...c,
        storeName: this.storeMap().get(c.storeId) ?? c.storeName,
      })),
  );

  // ── Delete camera with confirmation ───────────────────────────────────────
  protected readonly deleteTarget = signal<Camera | null>(null);
  protected readonly isDeleting = signal(false);
  protected readonly deleteError = signal('');

  protected requestDelete(cam: Camera): void {
    this.deleteError.set('');
    this.deleteTarget.set(cam);
  }

  protected cancelDelete(): void {
    if (this.isDeleting()) return;
    this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target || this.isDeleting()) return;
    this.isDeleting.set(true);
    this.deleteError.set('');
    this.cameraService
      .delete(target.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.connState.disconnectCamera(target.id);
          this.removedIds.update((s) => new Set(s).add(target.id));
          this.isDeleting.set(false);
          this.deleteTarget.set(null);
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

  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly storeFilter = signal<string>('all');

  protected readonly onlineCount = computed(() => this.listRes().onlineCount);
  protected readonly offlineCount = computed(() => this.listRes().offlineCount);
  protected readonly errorCount = computed(() => this.listRes().errorCount);

  protected readonly storeOptions = computed(() =>
    this.storeListRes().items
      .map((s) => ({ id: s.id, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

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

  protected readonly compact = computed(() => this.isMobile());

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.storeFilter.set('all');
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
