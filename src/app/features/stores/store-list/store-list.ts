import { Component, computed, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs';
import type { Store, StoreStatus } from '../../../core/models/store.model';
import { MOCK_STORES } from '../stores.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

type StatusFilter = 'all' | StoreStatus;

@Component({
  selector: 'app-store-list',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './store-list.html',
  styleUrl: './store-list.scss',
})
export class StoreListComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isNarrow = toSignal(
    this.breakpointObserver.observe('(max-width: 768px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected readonly stores = signal<Store[]>(MOCK_STORES);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly filteredStores = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();
    return this.stores().filter((store) => {
      const matchesSearch =
        !q ||
        store.name.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q) ||
        store.city.toLowerCase().includes(q);
      const matchesStatus = filter === 'all' || store.status === filter;
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly activeCount = computed(
    () => this.stores().filter((s) => s.status === 'active').length,
  );
  protected readonly totalCameras = computed(() =>
    this.stores().reduce((acc, s) => acc + s.cameraCount, 0),
  );
  protected readonly openAlerts = 7;
  protected readonly todayEvents = 24;

  protected readonly isFiltered = computed(
    () => this.searchQuery() !== '' || this.statusFilter() !== 'all',
  );

  protected readonly displayedColumns = computed<string[]>(() =>
    this.isNarrow()
      ? ['name', 'status', 'actions']
      : ['name', 'location', 'status', 'cameras', 'createdAt', 'actions'],
  );

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
  }
}
