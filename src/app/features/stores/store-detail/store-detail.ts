import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/services/auth.service';
import { StoreService, type AssignedUser } from '../../../core/services/store.service';
import { UserService } from '../../../core/services/user.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';

interface UserOption {
  id: number;
  name: string;
  role: string;
}

@Component({
  selector: 'app-store-detail',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './store-detail.html',
  styleUrl: './store-detail.scss',
})
export class StoreDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly storeService = inject(StoreService);
  private readonly userService = inject(UserService);

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));

  protected readonly storeId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly store = toSignal(this.storeService.getById(this.storeId), {
    initialValue: null,
  });

  // ── Assigned users (admin) ───────────────────────────────────────────────
  protected readonly assignedUsers = signal<AssignedUser[]>([]);
  protected readonly selectedUserId = signal<number | null>(null);
  protected readonly busy = signal(false);
  private readonly allUsers = signal<UserOption[]>([]);
  private loaded = false;

  /** Propietario users not yet assigned to this store. */
  protected readonly candidateUsers = computed(() => {
    const assigned = new Set(this.assignedUsers().map((u) => u.id));
    return this.allUsers().filter((u) => u.role === 'propietario' && !assigned.has(u.id));
  });

  constructor() {
    effect(() => {
      if (this.isAdmin() && !this.loaded) {
        this.loaded = true;
        this.loadAssignments();
        this.loadUsers();
      }
    });
  }

  private loadAssignments(): void {
    this.storeService
      .listAssignedUsers(this.storeId)
      .pipe(take(1))
      .subscribe({ next: (u) => this.assignedUsers.set(u), error: () => {} });
  }

  private loadUsers(): void {
    this.userService
      .list()
      .pipe(take(1))
      .subscribe({
        next: (res) =>
          this.allUsers.set(
            res.items.map((u) => ({ id: Number(u.id), name: u.fullName, role: u.role })),
          ),
        error: () => {},
      });
  }

  protected assign(): void {
    const id = this.selectedUserId();
    if (!id || this.busy()) return;
    this.busy.set(true);
    this.storeService
      .assignUser(this.storeId, id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.selectedUserId.set(null);
          this.busy.set(false);
          this.loadAssignments();
        },
        error: () => this.busy.set(false),
      });
  }

  protected remove(userId: number): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.storeService
      .unassignUser(this.storeId, userId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.loadAssignments();
        },
        error: () => this.busy.set(false),
      });
  }
}
