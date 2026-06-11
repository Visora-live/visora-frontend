import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  imports: [MatIconModule],
  template: `
    <div class="stat-card">
      <div class="stat-icon">
        <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      </div>
      <div class="stat-body">
        <p class="stat-value">{{ value() }}</p>
        <p class="stat-title">{{ title() }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--visora-space-md);
        background: var(--visora-bg-surface);
        border-radius: var(--visora-radius-md);
        padding: var(--visora-space-lg);
        box-shadow: var(--visora-shadow-sm);
        border: 1px solid var(--visora-border-color);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--visora-radius-md);
        background: rgba(22, 82, 163, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--visora-primary);
        flex-shrink: 0;
      }

      .stat-value {
        font-size: 26px;
        font-weight: 700;
        color: var(--visora-text);
        line-height: 1;
        margin-bottom: 4px;
      }

      .stat-title {
        font-size: 13px;
        color: var(--visora-text-muted);
        line-height: 1.4;
      }
    `,
  ],
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>('analytics');
}
