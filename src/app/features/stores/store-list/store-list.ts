import { Component, computed, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs';
import type { Store, StoreStatus } from '../../../core/models/store.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

type StatusFilter = 'all' | StoreStatus;

const MOCK_STORES: Store[] = [
  {
    id: '1',
    name: 'Tienda Miraflores Centro',
    address: 'Av. Larco 234, Piso 2',
    city: 'Miraflores',
    status: 'active',
    cameraCount: 12,
    createdAt: '2024-03-10',
  },
  {
    id: '2',
    name: 'Tienda San Isidro',
    address: 'Calle Las Begonias 521',
    city: 'San Isidro',
    status: 'active',
    cameraCount: 8,
    createdAt: '2024-04-05',
  },
  {
    id: '3',
    name: 'Tienda Surco Principal',
    address: 'Av. Javier Prado Este 3200',
    city: 'Santiago de Surco',
    status: 'active',
    cameraCount: 15,
    createdAt: '2024-01-20',
  },
  {
    id: '4',
    name: 'Tienda Callao Norte',
    address: 'Jr. Inca 456',
    city: 'Callao',
    status: 'inactive',
    cameraCount: 6,
    createdAt: '2024-05-12',
  },
  {
    id: '5',
    name: 'Tienda Barranco',
    address: 'Av. Grau 189, Loc. 3',
    city: 'Barranco',
    status: 'active',
    cameraCount: 9,
    createdAt: '2024-02-28',
  },
  {
    id: '6',
    name: 'Tienda La Molina',
    address: 'Av. La Molina 1500',
    city: 'La Molina',
    status: 'active',
    cameraCount: 11,
    createdAt: '2024-06-01',
  },
  {
    id: '7',
    name: 'Tienda Chorrillos Sur',
    address: 'Av. Defensores del Morro 800',
    city: 'Chorrillos',
    status: 'inactive',
    cameraCount: 4,
    createdAt: '2023-12-15',
  },
  {
    id: '8',
    name: 'Tienda Lince',
    address: 'Av. Iquitos 1240',
    city: 'Lince',
    status: 'active',
    cameraCount: 7,
    createdAt: '2024-07-08',
  },
];

@Component({
  selector: 'app-store-list',
  imports: [
    DatePipe,
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
