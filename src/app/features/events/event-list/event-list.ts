import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { MOCK_EVENTS } from '../events.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

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
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss',
})
export class EventListComponent {
  private readonly bp = inject(BreakpointObserver);
  private readonly isMobile = toSignal(
    this.bp.observe('(max-width: 768px)'),
    { initialValue: { matches: false, breakpoints: {} } },
  );

  protected readonly events = signal(MOCK_EVENTS);
  protected readonly searchQuery = signal('');
  protected readonly severityFilter = signal<SeverityFilter>('all');
  protected readonly typeFilter = signal<TypeFilter>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly todayCount = computed(
    () => this.events().filter((e) => e.timestamp.startsWith('2026-06-11')).length,
  );
  protected readonly criticalCount = computed(
    () => this.events().filter((e) => e.severity === 'critical').length,
  );
  protected readonly suspiciousCount = computed(
    () => this.events().filter((e) => e.severity === 'suspicious').length,
  );
  protected readonly evidenceCount = computed(
    () => this.events().reduce((acc, e) => acc + e.evidence.length, 0),
  );

  protected readonly filteredEvents = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sev = this.severityFilter();
    const typ = this.typeFilter();
    const st = this.statusFilter();
    return this.events().filter((e) => {
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
      this.statusFilter() !== 'all',
  );

  protected readonly displayedColumns = computed(() =>
    this.isMobile().matches
      ? ['timestamp', 'description', 'severity', 'actions']
      : ['timestamp', 'store', 'camera', 'type', 'severity', 'status', 'evidence', 'actions'],
  );

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.severityFilter.set('all');
    this.typeFilter.set('all');
    this.statusFilter.set('all');
  }

  protected severityToBadge(s: EventSeverity): BadgeStatus {
    return s === 'normal' ? 'normal' : s === 'suspicious' ? 'suspicious' : 'critical';
  }

  protected severityLabel(s: EventSeverity): string {
    return s === 'normal' ? 'Normal' : s === 'suspicious' ? 'Sospechoso' : 'Crítico';
  }

  protected typeLabel(t: EventType): string {
    const map: Record<EventType, string> = {
      facial_recognition: 'Reconocimiento facial',
      weapon_detection: 'Objeto crítico',
      suspicious_activity: 'Actividad sospechosa',
      system: 'Sistema',
    };
    return map[t];
  }

  protected typeIcon(t: EventType): string {
    const map: Record<EventType, string> = {
      facial_recognition: 'face',
      weapon_detection: 'security',
      suspicious_activity: 'warning',
      system: 'settings',
    };
    return map[t];
  }

  protected statusLabel(s: EventStatus): string {
    const map: Record<EventStatus, string> = {
      pending: 'Pendiente',
      reviewed: 'Revisado',
      dismissed: 'Descartado',
    };
    return map[s];
  }

  protected statusBadge(s: EventStatus): BadgeStatus {
    return s === 'pending' ? 'suspicious' : s === 'reviewed' ? 'normal' : 'inactive';
  }

  protected trackEvent(_: number, e: VisoraEvent): string {
    return e.id;
  }
}
