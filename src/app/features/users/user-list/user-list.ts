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
import type { User, UserRole, UserStatus } from '../../../core/models/user.model';
import { MOCK_USERS } from '../users.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

type RoleFilter = 'all' | UserRole;
type StatusFilterType = 'all' | UserStatus;

@Component({
  selector: 'app-user-list',
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
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserListComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isNarrow = toSignal(
    this.breakpointObserver.observe('(max-width: 768px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected readonly users = signal<User[]>(MOCK_USERS);
  protected readonly searchQuery = signal('');
  protected readonly roleFilter = signal<RoleFilter>('all');
  protected readonly statusFilter = signal<StatusFilterType>('all');

  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    const status = this.statusFilter();
    return this.users().filter((u) => {
      const matchesSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.storeName ?? '').toLowerCase().includes(q);
      const matchesRole = role === 'all' || u.role === role;
      const matchesStatus = status === 'all' || u.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  });

  protected readonly activeCount = computed(
    () => this.users().filter((u) => u.status === 'active').length,
  );
  protected readonly adminCount = computed(
    () => this.users().filter((u) => u.role === 'admin').length,
  );
  protected readonly operatorCount = computed(
    () => this.users().filter((u) => u.role === 'operator').length,
  );
  protected readonly inactiveCount = computed(
    () => this.users().filter((u) => u.status === 'inactive').length,
  );

  protected readonly isFiltered = computed(
    () =>
      this.searchQuery() !== '' ||
      this.roleFilter() !== 'all' ||
      this.statusFilter() !== 'all',
  );

  protected readonly displayedColumns = computed<string[]>(() =>
    this.isNarrow()
      ? ['name', 'role', 'status', 'actions']
      : ['name', 'role', 'store', 'status', 'createdAt', 'actions'],
  );

  protected roleLabel(role: UserRole): string {
    const map: Record<UserRole, string> = {
      admin: 'Administrador',
      operator: 'Operador',
      viewer: 'Visualizador',
    };
    return map[role];
  }

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('all');
    this.statusFilter.set('all');
  }
}
