import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
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
import { MOCK_ALERTS } from '../alerts.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
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
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './alert-list.html',
  styleUrl: './alert-list.scss',
})
export class AlertListComponent {
  private readonly bp = inject(BreakpointObserver);

  protected readonly alerts = signal(MOCK_ALERTS);
  protected readonly searchQuery = signal('');
  protected readonly severityFilter = signal<SeverityFilter>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly storeFilter = signal('all');

  protected readonly openCount = computed(
    () => this.alerts().filter((a) => a.status === 'open').length,
  );
  protected readonly criticalCount = computed(
    () => this.alerts().filter((a) => a.severity === 'critical').length,
  );
  protected readonly acknowledgedCount = computed(
    () => this.alerts().filter((a) => a.status === 'acknowledged').length,
  );
  protected readonly resolvedCount = computed(
    () => this.alerts().filter((a) => a.status === 'resolved').length,
  );

  protected readonly storeOptions = computed(() => {
    const seen = new Set<string>();
    return this.alerts()
      .filter((a) => {
        if (seen.has(a.storeId)) return false;
        seen.add(a.storeId);
        return true;
      })
      .map((a) => ({ id: a.storeId, name: a.storeName }));
  });

  protected readonly filteredAlerts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sev = this.severityFilter();
    const sta = this.statusFilter();
    const sto = this.storeFilter();
    return this.alerts().filter((a) => {
      if (sev !== 'all' && a.severity !== sev) return false;
      if (sta !== 'all' && a.status !== sta) return false;
      if (sto !== 'all' && a.storeId !== sto) return false;
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
      this.statusFilter() !== 'all' ||
      this.storeFilter() !== 'all',
  );

  private readonly isMobile = toSignal(
    this.bp.observe(['(max-width: 768px)']).pipe(map((s) => s.matches)),
    { initialValue: false },
  );

  protected readonly displayedColumns = computed(() =>
    this.isMobile()
      ? ['createdAt', 'description', 'severity', 'actions']
      : ['createdAt', 'store', 'camera', 'severity', 'status', 'event', 'assignedTo', 'actions'],
  );

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.severityFilter.set('all');
    this.statusFilter.set('all');
    this.storeFilter.set('all');
  }

  protected severityToBadge(s: EventSeverity): BadgeStatus {
    return s === 'normal' ? 'normal' : s === 'suspicious' ? 'suspicious' : 'critical';
  }

  protected severityLabel(s: EventSeverity): string {
    const map: Record<EventSeverity, string> = {
      normal: 'Normal',
      suspicious: 'Sospechosa',
      critical: 'Crítica',
    };
    return map[s];
  }

  protected statusLabel(s: AlertStatus): string {
    const map: Record<AlertStatus, string> = {
      open: 'Abierta',
      acknowledged: 'En revisión',
      resolved: 'Resuelta',
    };
    return map[s];
  }

  protected statusBadge(s: AlertStatus): BadgeStatus {
    return s === 'open' ? 'critical' : s === 'acknowledged' ? 'suspicious' : 'normal';
  }

  protected eventTypeLabel(t: EventType): string {
    const map: Record<EventType, string> = {
      facial_recognition: 'Reconocimiento facial',
      weapon_detection: 'Objeto crítico',
      suspicious_activity: 'Actividad sospechosa',
      system: 'Sistema',
    };
    return map[t];
  }

  protected eventTypeIcon(t: EventType): string {
    const map: Record<EventType, string> = {
      facial_recognition: 'face',
      weapon_detection: 'security',
      suspicious_activity: 'warning',
      system: 'settings',
    };
    return map[t];
  }

  protected trackAlert(_: number, a: { id: string }): string {
    return a.id;
  }
}
