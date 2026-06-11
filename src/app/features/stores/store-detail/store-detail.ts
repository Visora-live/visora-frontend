import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MOCK_STORES } from '../stores.mock';
import { MOCK_ALERTS } from '../../alerts/alerts.mock';
import { MOCK_EVENTS } from '../../events/events.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-store-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './store-detail.html',
  styleUrl: './store-detail.scss',
})
export class StoreDetailComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly storeId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly store = MOCK_STORES.find((s) => s.id === this.storeId) ?? null;

  protected readonly mockAlerts = MOCK_ALERTS.filter(
    (a) => a.storeId === this.storeId && a.status === 'open',
  ).length;
  protected readonly mockEvents = MOCK_EVENTS.filter(
    (e) => e.storeId === this.storeId,
  ).length;
  protected readonly mockResolved = MOCK_ALERTS.filter(
    (a) => a.storeId === this.storeId && a.status === 'resolved',
  ).length;
}
