import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MOCK_STORES } from '../stores.mock';
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

  protected readonly mockAlerts = 3;
  protected readonly mockEvents = 5;
}
