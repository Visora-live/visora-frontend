import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { EventSeverity, EventType } from '../../../core/models/event.model';
import type { AlertStatus } from '../../../core/models/alert.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { AlertService } from '../../../core/services/alert.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-alert-detail',
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
  templateUrl: './alert-detail.html',
  styleUrl: './alert-detail.scss',
})
export class AlertDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly alertService = inject(AlertService);

  protected readonly alertId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly alert = toSignal(this.alertService.getById(this.alertId), {
    initialValue: null,
  });

  protected readonly currentStatus = signal<AlertStatus>('open');
  protected readonly actionDone = signal<'acknowledged' | 'resolved' | null>(null);

  constructor() {
    effect(() => {
      const a = this.alert();
      if (a && this.actionDone() === null) {
        this.currentStatus.set(a.status);
      }
    });
  }

  protected markAcknowledged(): void {
    this.alertService.acknowledge(this.alertId).subscribe({
      next: () => {
        this.currentStatus.set('acknowledged');
        this.actionDone.set('acknowledged');
      },
    });
  }

  protected resolveAlert(): void {
    this.alertService.resolve(this.alertId).subscribe({
      next: () => {
        this.currentStatus.set('resolved');
        this.actionDone.set('resolved');
      },
    });
  }

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
