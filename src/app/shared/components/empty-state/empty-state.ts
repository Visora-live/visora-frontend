import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="empty-state" role="status">
      <mat-icon class="empty-icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <h2 class="empty-title">{{ title() }}</h2>
      @if (description()) {
        <p class="empty-description">{{ description() }}</p>
      }
      <div class="empty-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px var(--visora-space-xl);
        text-align: center;
      }

      .empty-icon {
        font-size: 52px;
        width: 52px;
        height: 52px;
        color: var(--visora-text-muted);
        opacity: 0.4;
        margin-bottom: var(--visora-space-lg);
      }

      .empty-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--visora-text);
        margin-bottom: var(--visora-space-sm);
      }

      .empty-description {
        font-size: 14px;
        color: var(--visora-text-muted);
        max-width: 380px;
        line-height: 1.6;
        margin-bottom: var(--visora-space-lg);
      }

      .empty-actions {
        display: flex;
        gap: var(--visora-space-sm);
        flex-wrap: wrap;
        justify-content: center;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
}
