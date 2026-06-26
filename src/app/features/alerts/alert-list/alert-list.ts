import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { EventSeverity, EventType } from '../../../core/models/event.model';
import type { AlertStatus } from '../../../core/models/alert.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { AlertService } from '../../../core/services/alert.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

type SeverityFilter = 'all' | EventSeverity;
type StatusFilter = 'all' | AlertStatus;

@Component({
  selector: 'app-alert-list',
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
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './alert-list.html',
  styleUrl: './alert-list.scss',
})
export class AlertListComponent {
  private readonly bp = inject(BreakpointObserver);
  private readonly alertService = inject(AlertService);
  private readonly storeCtx = inject(StoreContextService);

  private readonly isMobile = toSignal(
    this.bp.observe(['(max-width: 768px)']).pipe(map((s) => s.matches)),
    { initialValue: false },
  );

  private readonly listRes = toSignal(
    toObservable(this.storeCtx.activeStoreId).pipe(switchMap((id) => this.alertService.list(id))),
    { initialValue: { items: [], total: 0, openCount: 0, criticalCount: 0, acknowledgedCount: 0, resolvedCount: 0 } },
  );

  protected readonly alerts = computed(() => this.listRes().items);
  protected readonly searchQuery = signal('');
  protected readonly severityFilter = signal<SeverityFilter>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly openCount = computed(() => this.listRes().openCount);
  protected readonly criticalCount = computed(() => this.listRes().criticalCount);
  protected readonly acknowledgedCount = computed(() => this.listRes().acknowledgedCount);
  protected readonly resolvedCount = computed(() => this.listRes().resolvedCount);

  protected readonly filteredAlerts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sev = this.severityFilter();
    const sta = this.statusFilter();
    return this.alerts().filter((a) => {
      if (sev !== 'all' && a.severity !== sev) return false;
      if (sta !== 'all' && a.status !== sta) return false;
      if (
        q &&
        !a.storeName.toLowerCase().includes(q) &&
        !a.cameraName.toLowerCase().includes(q) &&
        !a.title.toLowerCase().includes(q) &&
        !a.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  });

  protected readonly isFiltered = computed(
    () =>
      this.searchQuery().trim() !== '' ||
      this.severityFilter() !== 'all' ||
      this.statusFilter() !== 'all',
  );

  protected readonly displayedColumns = computed(() =>
    this.isMobile()
      ? ['createdAt', 'description', 'severity', 'actions']
      : ['createdAt', 'store', 'camera', 'severity', 'status', 'event', 'assignedTo', 'actions'],
  );

  protected severityToBadge(s: EventSeverity): BadgeStatus {
    return s === 'normal' ? 'normal' : s === 'suspicious' ? 'suspicious' : 'critical';
  }

  protected severityLabel(s: EventSeverity): string {
    const m: Record<EventSeverity, string> = {
      normal: 'Normal',
      suspicious: 'Sospechosa',
      critical: 'Crítica',
    };
    return m[s];
  }

  protected statusLabel(s: AlertStatus): string {
    const m: Record<AlertStatus, string> = {
      open: 'Abierta',
      acknowledged: 'En revisión',
      resolved: 'Resuelta',
    };
    return m[s];
  }

  protected statusBadge(s: AlertStatus): BadgeStatus {
    return s === 'open' ? 'critical' : s === 'acknowledged' ? 'suspicious' : 'normal';
  }

  protected eventTypeLabel(t: EventType): string {
    const m: Record<EventType, string> = {
      facial_recognition: 'Reconocimiento facial',
      weapon_detection: 'Objeto crítico',
      suspicious_activity: 'Actividad sospechosa',
      system: 'Sistema',
    };
    return m[t];
  }

  protected eventTypeIcon(t: EventType): string {
    const m: Record<EventType, string> = {
      facial_recognition: 'face',
      weapon_detection: 'security',
      suspicious_activity: 'warning',
      system: 'settings',
    };
    return m[t];
  }
}
