import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { take } from 'rxjs';
import { StoreContextService } from '../../../core/services/store-context.service';
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
import { StoreService } from '../../../core/services/store.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { HlsPlayerComponent } from '../../../shared/components/hls-player/hls-player';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

type StatusFilter = 'all' | CameraStatus;

const EMPTY_CAM_LIST = { items: [], total: 0, onlineCount: 0, offlineCount: 0 };
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
    HlsPlayerComponent,
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
  private readonly storeService = inject(StoreService);

  /** HLS stream URL for a camera (MediaMTX path = cam<id>). */
  protected hlsUrl(cameraId: string): string {
    return `${environment.mediamtxHlsBase}/cam${cameraId}/index.m3u8`;
  }

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));
  private readonly storeCtx = inject(StoreContextService);

  private readonly isMobile = toSignal(
    this.bp.observe('(max-width: 600px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  private readonly listRes = toSignal(
    toObservable(this.storeCtx.activeStoreId).pipe(switchMap((id) => this.cameraService.list(id))),
    { initialValue: EMPTY_CAM_LIST },
  );
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

  protected readonly onlineCount = computed(() => this.listRes().onlineCount);
  protected readonly offlineCount = computed(() => this.listRes().offlineCount);

  protected readonly filteredCameras = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.statusFilter();
    return this.cameras().filter((c) => {
      if (st !== 'all' && c.status !== st) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.location.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  });

  protected readonly isFiltered = computed(
    () =>
      this.searchQuery().trim() !== '' ||
      this.statusFilter() !== 'all',
  );

  protected readonly compact = computed(() => this.isMobile());

  protected cameraStatusToBadge(status: CameraStatus): BadgeStatus {
    return status === 'online' ? 'normal' : 'inactive';
  }

  protected cameraStatusLabel(status: CameraStatus): string {
    return status === 'online' ? 'En línea' : 'Sin señal';
  }
}
