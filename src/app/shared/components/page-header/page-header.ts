import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header-actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--visora-space-md);
        margin-bottom: var(--visora-space-xl);
      }

      .page-title {
        font-size: 22px;
        font-weight: 700;
        color: var(--visora-text);
        line-height: 1.2;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--visora-text-muted);
        margin-top: var(--visora-space-xs);
        line-height: 1.5;
      }

      .page-header-actions {
        display: flex;
        align-items: center;
        gap: var(--visora-space-sm);
        flex-shrink: 0;
      }
    `,
  ],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
