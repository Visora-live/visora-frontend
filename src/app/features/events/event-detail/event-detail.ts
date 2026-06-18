import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type {
  EventSeverity,
  EventType,
  EventStatus,
} from '../../../core/models/event.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { EventService } from '../../../core/services/event.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-event-detail',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);

  protected readonly eventId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly event = toSignal(this.eventService.getById(this.eventId), {
    initialValue: null,
  });

  protected readonly currentStatus = signal<EventStatus>('pending');
  protected readonly actionDone = signal<'reviewed' | 'dismissed' | null>(null);

  constructor() {
    effect(() => {
      const e = this.event();
      if (e && this.actionDone() === null) {
        this.currentStatus.set(e.status);
      }
    });
  }

  protected markReviewed(): void {
    this.eventService.updateStatus(this.eventId, 'reviewed').subscribe({
      next: () => {
        this.currentStatus.set('reviewed');
        this.actionDone.set('reviewed');
      },
    });
  }

  protected dismissEvent(): void {
    this.eventService.updateStatus(this.eventId, 'dismissed').subscribe({
      next: () => {
        this.currentStatus.set('dismissed');
        this.actionDone.set('dismissed');
      },
    });
  }

  protected severityToBadge(s: EventSeverity): BadgeStatus {
    return s === 'normal' ? 'normal' : s === 'suspicious' ? 'suspicious' : 'critical';
  }

  protected severityLabel(s: EventSeverity): string {
    const m: Record<EventSeverity, string> = {
      normal: 'Normal',
      suspicious: 'Sospechoso',
      critical: 'Crítico',
    };
    return m[s];
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

  protected confidencePct(c: number): string {
    return `${Math.round(c * 100)}%`;
  }
}
