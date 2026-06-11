import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { UserRole } from '../../../core/models/user.model';
import { MOCK_USERS } from '../users.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-user-detail',
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
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
})
export class UserDetailComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly userId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly user = MOCK_USERS.find((u) => u.id === this.userId) ?? null;

  protected roleLabel(role: UserRole): string {
    const map: Record<UserRole, string> = {
      admin: 'Administrador',
      operator: 'Operador',
      viewer: 'Visualizador',
    };
    return map[role];
  }

  protected roleIcon(role: UserRole): string {
    const map: Record<UserRole, string> = {
      admin: 'admin_panel_settings',
      operator: 'manage_accounts',
      viewer: 'visibility',
    };
    return map[role];
  }
}
