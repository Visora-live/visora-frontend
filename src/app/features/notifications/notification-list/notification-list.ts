import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { RecoveryRequest } from '../../../core/services/recovery.service';
import { RecoveryService } from '../../../core/services/recovery.service';
import { UserService } from '../../../core/services/user.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-notification-list',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.scss',
})
export class NotificationListComponent {
  private readonly recovery = inject(RecoveryService);
  private readonly userService = inject(UserService);

  protected readonly requests = signal<RecoveryRequest[]>([]);
  protected readonly loaded = signal(false);

  // username (lowercased) → user id, to jump straight to "edit password".
  private readonly userByName = signal<Map<string, string>>(new Map());

  /** Resolves the requester to a user id (matching by username), or null. */
  protected userIdFor(identificador: string): string | null {
    return this.userByName().get(identificador.trim().toLowerCase()) ?? null;
  }

  protected readonly unreadCount = computed(
    () => this.requests().filter((r) => !r.leida).length,
  );
  protected readonly showUnreadOnly = signal(false);
  protected readonly visible = computed(() =>
    this.showUnreadOnly() ? this.requests().filter((r) => !r.leida) : this.requests(),
  );

  constructor() {
    this.recovery
      .list()
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.requests.set(items);
          this.loaded.set(true);
        },
        error: () => this.loaded.set(true),
      });

    this.userService
      .list()
      .pipe(take(1))
      .subscribe({
        next: (res) =>
          this.userByName.set(
            new Map(res.items.map((u) => [u.fullName.trim().toLowerCase(), u.id])),
          ),
        error: () => {},
      });
  }

  protected toggleUnreadOnly(): void {
    this.showUnreadOnly.update((v) => !v);
  }

  protected markRead(req: RecoveryRequest): void {
    if (req.leida) return;
    this.recovery
      .markRead(req.id)
      .pipe(take(1))
      .subscribe(() => {
        this.requests.update((list) =>
          list.map((r) => (r.id === req.id ? { ...r, leida: true } : r)),
        );
        this.recovery.refreshUnread(); // keep the sidebar badge in sync
      });
  }
}
