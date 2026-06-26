import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type {
  EventSeverity,
  EventType,
  EventStatus,
  VisoraEvent,
} from '../../../core/models/event.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { EventService } from '../../../core/services/event.service';
import { CameraService } from '../../../core/services/camera.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

const EMPTY_CAM_LIST = { items: [], total: 0, onlineCount: 0, offlineCount: 0, errorCount: 0 };

type SeverityFilter = 'all' | EventSeverity;
type TypeFilter = 'all' | EventType;
type StatusFilter = 'all' | EventStatus;

@Component({
  selector: 'app-event-list',
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss',
})
export class EventListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly bp = inject(BreakpointObserver);
  private readonly eventService = inject(EventService);
  private readonly cameraService = inject(CameraService);
  private readonly storeCtx = inject(StoreContextService);

  private readonly isMobile = toSignal(
    this.bp.observe('(max-width: 768px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  private readonly listRes = toSignal(
    toObservable(this.storeCtx.activeStoreId).pipe(switchMap((id) => this.eventService.list(id))),
    { initialValue: { items: [], total: 0, todayCount: 0, criticalCount: 0, suspiciousCount: 0, evidenceCount: 0 } },
  );

  // Owner-scoped cameras for the "filter by camera" dropdown.
  private readonly camListRes = toSignal(
    toObservable(this.storeCtx.activeStoreId).pipe(switchMap((id) => this.cameraService.list(id))),
    { initialValue: EMPTY_CAM_LIST },
  );
  protected readonly cameraOptions = computed(() =>
    this.camListRes().items
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  // IDs deleted in this session — filtered out without a full refetch.
  private readonly removedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly events = computed(() =>
    this.listRes().items.filter((e) => !this.removedIds().has(e.id)),
  );
  protected readonly searchQuery = signal('');
  protected readonly severityFilter = signal<SeverityFilter>('all');
  protected readonly typeFilter = signal<TypeFilter>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly cameraFilter = signal<string>(
    this.route.snapshot.queryParamMap.get('camera') ?? 'all',
  );

  protected readonly todayCount = computed(() => this.listRes().todayCount);
  protected readonly criticalCount = computed(() => this.listRes().criticalCount);
  protected readonly suspiciousCount = computed(() => this.listRes().suspiciousCount);
  protected readonly evidenceCount = computed(() => this.listRes().evidenceCount);

  protected readonly filteredEvents = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sev = this.severityFilter();
    const typ = this.typeFilter();
    const st = this.statusFilter();
    const cam = this.cameraFilter();
    return this.events().filter((e) => {
      if (cam !== 'all' && e.cameraId !== cam) return false;
      if (sev !== 'all' && e.severity !== sev) return false;
      if (typ !== 'all' && e.type !== typ) return false;
      if (st !== 'all' && e.status !== st) return false;
      if (q) {
        const hay = `${e.storeName} ${e.cameraName} ${e.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  protected readonly isFiltered = computed(
    () =>
      this.searchQuery().trim() !== '' ||
      this.severityFilter() !== 'all' ||
      this.typeFilter() !== 'all' ||
      this.statusFilter() !== 'all' ||
      this.cameraFilter() !== 'all',
  );

  // ── Delete with confirmation ──────────────────────────────────────────────
  protected readonly deleteTarget = signal<VisoraEvent | null>(null);
  protected readonly isDeleting = signal(false);
  protected readonly deleteError = signal('');

  protected requestDelete(e: VisoraEvent): void {
    this.deleteError.set('');
    this.deleteTarget.set(e);
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
    this.eventService
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
              ? 'No tienes permisos para eliminar este evento.'
              : err.status === 404
                ? 'El evento ya no existe.'
                : 'No se pudo eliminar el evento. Intenta de nuevo.',
          );
        },
      });
  }

  protected readonly displayedColumns = computed(() =>
    this.isMobile()
      ? ['timestamp', 'description', 'severity', 'actions']
      : ['timestamp', 'store', 'camera', 'type', 'severity', 'status', 'evidence', 'actions'],
  );

  protected severityToBadge(s: EventSeverity): BadgeStatus {
    return s === 'normal' ? 'normal' : s === 'suspicious' ? 'suspicious' : 'critical';
  }

  protected severityLabel(s: EventSeverity): string {
    return s === 'normal' ? 'Normal' : s === 'suspicious' ? 'Sospechoso' : 'Crítico';
  }

  protected typeLabel(t: EventType): string {
    const m: Record<EventType, string> = {
      facial_recognition: 'Reconocimiento facial',
      weapon_detection: 'Objeto crítico',
      suspicious_activity: 'Actividad sospechosa',
      system: 'Sistema',
    };
    return m[t];
  }

  protected typeIcon(t: EventType): string {
    const m: Record<EventType, string> = {
      facial_recognition: 'face',
      weapon_detection: 'security',
      suspicious_activity: 'warning',
      system: 'settings',
    };
    return m[t];
  }

  protected statusLabel(s: EventStatus): string {
    const m: Record<EventStatus, string> = {
      pending: 'Pendiente',
      reviewed: 'Revisado',
      dismissed: 'Descartado',
    };
    return m[s];
  }

  protected statusBadge(s: EventStatus): BadgeStatus {
    return s === 'pending' ? 'suspicious' : s === 'reviewed' ? 'normal' : 'inactive';
  }
}
