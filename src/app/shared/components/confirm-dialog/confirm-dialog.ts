import { Component, HostListener, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable VISORA confirmation dialog. Render it in a parent and drive it with
 * an `open` signal; it emits `confirm` / `cancel`. The parent performs the
 * action and may keep it open (busy / errorMessage) until the request resolves.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (open()) {
      <div class="cd-overlay" (click)="cancel.emit()">
        <div
          class="cd-card"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          (click)="$event.stopPropagation()"
        >
          <div class="cd-icon" aria-hidden="true">
            <mat-icon>warning</mat-icon>
          </div>
          <h2 class="cd-title">{{ title() }}</h2>
          @if (message()) { <p class="cd-message">{{ message() }}</p> }
          @if (errorMessage()) { <p class="cd-error" role="alert">{{ errorMessage() }}</p> }
          <div class="cd-actions">
            <button mat-stroked-button (click)="cancel.emit()" [disabled]="busy()">
              {{ cancelLabel() }}
            </button>
            <button mat-flat-button class="cd-confirm" (click)="confirm.emit()" [disabled]="busy()">
              <mat-icon aria-hidden="true">{{ busy() ? 'hourglass_top' : confirmIcon() }}</mat-icon>
              {{ busy() ? 'Eliminando...' : confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host { display: contents; }

      .cd-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(15, 20, 27, 0.5);
        backdrop-filter: blur(2px);
        animation: cd-fade 0.18s ease both;
      }

      .cd-card {
        width: 100%;
        max-width: 420px;
        background: var(--visora-bg-surface);
        border: 1px solid var(--visora-border-color);
        border-radius: var(--visora-radius-lg);
        box-shadow: 0 20px 50px -20px rgba(15, 20, 27, 0.55);
        padding: 28px 26px;
        text-align: center;
        animation: cd-pop 0.2s ease both;
      }

      .cd-icon {
        width: 52px;
        height: 52px;
        margin: 0 auto 14px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--visora-status-critical);
        background: var(--visora-status-critical-bg);
        mat-icon { font-size: 28px; width: 28px; height: 28px; }
      }

      .cd-title {
        margin: 0 0 8px;
        font-family: 'Lora', Georgia, serif;
        font-size: 21px;
        font-weight: 600;
        color: var(--visora-text);
      }

      .cd-message {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--visora-text-muted);
      }

      .cd-error {
        margin: 14px 0 0;
        padding: 9px 12px;
        font-size: 13px;
        color: #b91c1c;
        background: rgba(220, 38, 38, 0.08);
        border: 1px solid rgba(220, 38, 38, 0.25);
        border-radius: 10px;
      }

      .cd-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 22px;
      }

      .cd-confirm {
        gap: 6px;
        background: var(--visora-status-critical) !important;
        color: #fff !important;
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
      }

      @media (max-width: 480px) {
        .cd-actions { flex-direction: column-reverse; }
        .cd-actions button { width: 100%; }
      }

      @keyframes cd-fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes cd-pop {
        from { opacity: 0; transform: translateY(8px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        .cd-overlay, .cd-card { animation: none; }
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('¿Confirmar acción?');
  readonly message = input('');
  readonly errorMessage = input('');
  readonly confirmLabel = input('Eliminar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmIcon = input('delete');
  readonly busy = input(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open() && !this.busy()) this.cancel.emit();
  }
}
