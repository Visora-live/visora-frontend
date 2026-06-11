import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type BadgeStatus = 'normal' | 'suspicious' | 'critical' | 'inactive';

interface BadgeConfig {
  label: string;
  icon: string;
}

const STATUS_CONFIG: Record<BadgeStatus, BadgeConfig> = {
  normal: { label: 'Normal', icon: 'check_circle' },
  suspicious: { label: 'Sospechoso', icon: 'warning' },
  critical: { label: 'Crítico', icon: 'error' },
  inactive: { label: 'Inactivo', icon: 'radio_button_unchecked' },
};

@Component({
  selector: 'app-status-badge',
  imports: [MatIconModule],
  template: `
    <span [class]="badgeClass()" role="status" [attr.aria-label]="displayLabel()">
      <mat-icon class="badge-icon" aria-hidden="true">{{ config().icon }}</mat-icon>
      <span class="badge-text">{{ displayLabel() }}</span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px 4px 6px;
        border-radius: 100px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        white-space: nowrap;
      }

      .badge-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .badge--normal {
        background: var(--visora-status-normal-bg);
        color: var(--visora-status-normal);
      }

      .badge--suspicious {
        background: var(--visora-status-suspicious-bg);
        color: var(--visora-status-suspicious);
      }

      .badge--critical {
        background: var(--visora-status-critical-bg);
        color: var(--visora-status-critical);
      }

      .badge--inactive {
        background: var(--visora-status-inactive-bg);
        color: var(--visora-status-inactive);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly status = input.required<BadgeStatus>();
  readonly label = input<string>('');

  protected readonly config = computed(() => STATUS_CONFIG[this.status()]);
  protected readonly badgeClass = computed(() => `badge badge--${this.status()}`);
  protected readonly displayLabel = computed(() => this.label() || this.config().label);
}
