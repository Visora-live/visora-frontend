import { Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { EventSeverity, EventType } from '../../../core/models/event.model';
import type { AlertStatus } from '../../../core/models/alert.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { MOCK_ALERTS } from '../alerts.mock';
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

  protected readonly alertId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly alert = MOCK_ALERTS.find((a) => a.id === this.alertId) ?? null;

  protected readonly currentStatus = signal<AlertStatus>(this.alert?.status ?? 'open');
  protected readonly actionDone = signal<'acknowledged' | 'resolved' | null>(null);

  protected markAcknowledged(): void {
    this.currentStatus.set('acknowledged');
    this.actionDone.set('acknowledged');
  }

  protected resolveAlert(): void {
    this.currentStatus.set('resolved');
    this.actionDone.set('resolved');
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
}
