import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { UserRole } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
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
  private readonly userService = inject(UserService);

  protected readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly user = toSignal(this.userService.getById(this.userId), {
    requireSync: true,
  });

  protected roleLabel(role: UserRole): string {
    const m: Record<UserRole, string> = {
      admin: 'Administrador',
      operator: 'Operador',
      viewer: 'Visualizador',
    };
    return m[role];
  }

  protected roleIcon(role: UserRole): string {
    const m: Record<UserRole, string> = {
      admin: 'admin_panel_settings',
      operator: 'manage_accounts',
      viewer: 'visibility',
    };
    return m[role];
  }
}
