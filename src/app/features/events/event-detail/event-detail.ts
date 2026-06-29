import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
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
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  protected readonly eventId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly event = toSignal(this.eventService.getById(this.eventId), {
    initialValue: null,
  });

  protected readonly currentStatus = signal<EventStatus>('pending');

  constructor() {
    effect(() => {
      const e = this.event();
      if (e) this.currentStatus.set(e.status);
    });
  }

  protected markReviewed(): void {
    this.eventService.updateStatus(this.eventId, 'reviewed').subscribe({
      next: () => this.currentStatus.set('reviewed'),
    });
  }

  // ── Descartar = soft-delete with confirmation ─────────────────────────────
  protected readonly confirmingDiscard = signal(false);
  protected readonly isDiscarding = signal(false);
  protected readonly discardError = signal('');

  protected requestDiscard(): void {
    this.discardError.set('');
    this.confirmingDiscard.set(true);
  }

  protected cancelDiscard(): void {
    if (this.isDiscarding()) return;
    this.confirmingDiscard.set(false);
  }

  protected confirmDiscard(): void {
    if (this.isDiscarding()) return;
    this.isDiscarding.set(true);
    this.discardError.set('');
    this.eventService
      .delete(this.eventId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isDiscarding.set(false);
          this.confirmingDiscard.set(false);
          void this.router.navigate(['/events']);
        },
        error: (err: HttpErrorResponse) => {
          this.isDiscarding.set(false);
          this.discardError.set(
            err.status === 403
              ? 'No tienes permisos para descartar este evento.'
              : err.status === 404
                ? 'El evento ya no existe.'
                : 'No se pudo descartar el evento. Intenta de nuevo.',
          );
        },
      });
  }

  protected severityToBadge(s: EventSeverity): BadgeStatus {
    return s === 'normal' ? 'normal' : s === 'suspicious' ? 'suspicious' : 'critical';
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
