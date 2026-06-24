import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">{{ title() }}</h1>
        <span class="page-title-rule" aria-hidden="true"></span>
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
        align-items: flex-end;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--visora-space-md);
        margin-bottom: var(--visora-space-lg);
        animation: ph-rise 0.4s ease both;
      }

      .page-header-text {
        min-width: 0;
        flex: 1 1 auto;
      }

      .page-title {
        margin: 0;
        font-family: 'Lora', Georgia, serif;
        font-size: 28px;
        font-weight: 600;
        color: var(--visora-text);
        line-height: 1.2;
        letter-spacing: 0.2px;
        overflow-wrap: anywhere;
      }

      .page-title-rule {
        display: block;
        width: 48px;
        height: 3px;
        margin-top: 10px;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--visora-primary), var(--visora-accent));
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--visora-text-muted);
        margin: 10px 0 0;
        line-height: 1.5;
        max-width: 70ch;
      }

      .page-header-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--visora-space-sm);
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .page-title { font-size: 24px; }
        .page-header-actions { width: 100%; }
      }

      @keyframes ph-rise {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .page-header { animation: none; }
      }
    `,
  ],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
