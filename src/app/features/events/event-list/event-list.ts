import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { StoreContextService } from '../../../core/services/store-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { PaginatorIntlEs } from '../../../shared/i18n/paginator-intl-es';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { EventStatus, VisoraEvent } from '../../../core/models/event.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { EventService } from '../../../core/services/event.service';
import { CameraService } from '../../../core/services/camera.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

const EMPTY_CAM_LIST = { items: [], total: 0, onlineCount: 0, offlineCount: 0 };

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
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: PaginatorIntlEs }],
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

  private readonly camListRes = toSignal(
    toObservable(this.storeCtx.activeStoreId).pipe(switchMap((id) => this.cameraService.list(id))),
    { initialValue: EMPTY_CAM_LIST },
  );
  protected readonly cameraOptions = computed(() =>
    this.camListRes().items
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  protected readonly events = computed(() => this.listRes().items);
  protected readonly searchQuery = signal('');
  protected readonly cameraFilter = signal<string>(
    this.route.snapshot.queryParamMap.get('camera') ?? 'all',
  );

  protected readonly todayCount = computed(() => this.listRes().todayCount);
  protected readonly criticalCount = computed(() => this.listRes().criticalCount);
  protected readonly suspiciousCount = computed(() => this.listRes().suspiciousCount);
  protected readonly evidenceCount = computed(() => this.listRes().evidenceCount);

  protected readonly filteredEvents = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cam = this.cameraFilter();
    return this.events().filter((e) => {
      if (cam !== 'all' && e.cameraId !== cam) return false;
      if (q) {
        const hay = `${e.storeName} ${e.cameraName} ${e.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  // ── Pagination (client-side over the full, already-filtered list) ─────────
  protected readonly pageSizeOptions = [25, 50, 100];
  protected readonly pageSize = signal(25);
  private readonly requestedPage = signal(0);

  /** Page index clamped to the current result set (filters can shrink it). */
  protected readonly pageIndex = computed(() => {
    const lastPage = Math.max(0, Math.ceil(this.filteredEvents().length / this.pageSize()) - 1);
    return Math.min(this.requestedPage(), lastPage);
  });

  protected readonly pagedEvents = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredEvents().slice(start, start + this.pageSize());
  });

  protected onPage(e: PageEvent): void {
    this.pageSize.set(e.pageSize);
    this.requestedPage.set(e.pageIndex);
  }

  protected setSearch(q: string): void {
    this.searchQuery.set(q);
    this.requestedPage.set(0);
  }

  protected setCamera(cam: string): void {
    this.cameraFilter.set(cam);
    this.requestedPage.set(0);
  }

  protected readonly isFiltered = computed(
    () => this.searchQuery().trim() !== '' || this.cameraFilter() !== 'all',
  );

  protected readonly displayedColumns = computed(() =>
    this.isMobile()
      ? ['timestamp', 'description', 'actions']
      : ['timestamp', 'store', 'camera', 'infractor', 'status', 'actions'],
  );

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

  protected infractorLabel(e: VisoraEvent): string {
    const p = e.identifications[0];
    if (!p?.nombres) return '-';
    return [p.nombres, p.apellidoPaterno].filter(Boolean).join(' ');
  }
}
