import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import type { VisoraEvent } from '../../../core/models/event.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CameraStatus } from '../../../core/models/camera.model';
import type { BadgeStatus } from '../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../core/services/auth.service';
import { CameraService } from '../../../core/services/camera.service';
import { EventService } from '../../../core/services/event.service';
import { AlertService } from '../../../core/services/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { HlsPlayerComponent } from '../../../shared/components/hls-player/hls-player';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

interface SubmitResult {
  success: boolean;
  eventId?: number;
  alertId?: number;
  message: string;
}

@Component({
  selector: 'app-camera-detail',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    ConfirmDialogComponent,
    HlsPlayerComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './camera-detail.html',
  styleUrl: './camera-detail.scss',
})
export class CameraDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly cameraService = inject(CameraService);
  private readonly eventService = inject(EventService);
  private readonly alertService = inject(AlertService);

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));

  protected readonly cameraId = this.route.snapshot.paramMap.get('id') ?? '';

  // HLS stream + RTMP push URL for this camera (MediaMTX path = cam<id>).
  protected readonly hlsUrl = `${environment.mediamtxHlsBase}/cam${this.cameraId}/index.m3u8`;
  protected readonly rtmpPushUrl = `${environment.mediamtxRtmpUrl}/cam${this.cameraId}`;

  protected readonly camera = toSignal(this.cameraService.getById(this.cameraId), {
    initialValue: null,
  });

  protected readonly recentEvents = toSignal(
    this.cameraService.getRecentEvents(this.cameraId, 5),
    { initialValue: [] as VisoraEvent[] },
  );

  protected cameraStatusToBadge(status: CameraStatus): BadgeStatus {
    return status === 'online' ? 'normal' : 'inactive';
  }

  protected cameraStatusLabel(status: CameraStatus): string {
    return status === 'online' ? 'En línea' : 'Sin señal';
  }

  protected copyToClipboard(url: string): void {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  // ── Delete camera with confirmation ───────────────────────────────────────
  protected readonly confirmingDelete = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly deleteError = signal('');

  protected requestDelete(): void {
    this.deleteError.set('');
    this.confirmingDelete.set(true);
  }

  protected cancelDelete(): void {
    if (this.isDeleting()) return;
    this.confirmingDelete.set(false);
  }

  protected confirmDelete(): void {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);
    this.deleteError.set('');
    this.cameraService
      .delete(this.cameraId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.confirmingDelete.set(false);
          void this.router.navigate([this.isAdmin() ? '/cameras' : '/dashboard']);
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

  // ── Registro manual de evento ─────────────────────────────────────────────

  protected readonly showEventForm = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitResult = signal<SubmitResult | null>(null);

  protected readonly eventTipo = signal('manual');
  protected readonly eventSeveridad = signal('media');
  protected readonly eventComentario = signal('');
  protected readonly generarAlerta = signal(false);
  protected readonly alertaTitulo = signal('');
  protected readonly alertaDesc = signal('');

  protected readonly formValid = computed(
    () =>
      this.eventComentario().trim().length > 0 &&
      (!this.generarAlerta() || this.alertaTitulo().trim().length > 0),
  );

  protected toggleEventForm(): void {
    this.showEventForm.update((v) => !v);
    this.submitResult.set(null);
  }

  protected submitEvent(): void {
    if (this.isSubmitting() || !this.formValid()) return;
    this.isSubmitting.set(true);
    this.submitResult.set(null);

    this.eventService
      .create({
        tipo: this.eventTipo(),
        severidad: this.eventSeveridad(),
        camaraId: Number(this.cameraId),
        comentario: this.eventComentario().trim(),
      })
      .pipe(take(1))
      .subscribe({
        next: (evt) => {
          if (this.generarAlerta()) {
            const c = this.camera();
            this.alertService
              .create({
                titulo: this.alertaTitulo().trim(),
                descripcion: this.alertaDesc().trim() || undefined,
                tipo: this.eventTipo(),
                severidad: this.eventSeveridad(),
                eventoId: Number(evt.id),
                camaraId: Number(this.cameraId),
                tiendaId: c ? Number(c.storeId) : undefined,
              })
              .pipe(take(1))
              .subscribe({
                next: (alert) => {
                  this.submitResult.set({
                    success: true,
                    eventId: Number(evt.id),
                    alertId: Number(alert.id),
                    message: 'Evento y alerta registrados correctamente.',
                  });
                  this.isSubmitting.set(false);
                  this.resetEventForm();
                },
                error: () => {
                  this.submitResult.set({
                    success: true,
                    eventId: Number(evt.id),
                    message: 'Evento registrado. No se pudo crear la alerta.',
                  });
                  this.isSubmitting.set(false);
                  this.resetEventForm();
                },
              });
          } else {
            this.submitResult.set({
              success: true,
              eventId: Number(evt.id),
              message: 'Evento registrado correctamente.',
            });
            this.isSubmitting.set(false);
            this.resetEventForm();
          }
        },
        error: (err) => {
          const msg =
            err?.status === 403
              ? 'No tienes permisos para registrar eventos en esta cámara.'
              : 'Error al registrar el evento. Intenta de nuevo.';
          this.submitResult.set({ success: false, message: msg });
          this.isSubmitting.set(false);
        },
      });
  }

  private resetEventForm(): void {
    this.eventComentario.set('');
    this.alertaTitulo.set('');
    this.alertaDesc.set('');
    this.generarAlerta.set(false);
  }
}
