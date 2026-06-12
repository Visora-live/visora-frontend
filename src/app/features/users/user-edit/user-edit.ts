import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { UserRole, UserStatus } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { StoreService } from '../../../core/services/store.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-user-edit',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
})
export class UserEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly storeService = inject(StoreService);

  protected readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly user = toSignal(this.userService.getById(this.userId), {
    requireSync: true,
  });

  private readonly storeListRes = toSignal(this.storeService.list(), { requireSync: true });
  protected readonly stores = computed(() => this.storeListRes().items);

  protected readonly form = this.fb.nonNullable.group({
    fullName: [this.user()?.fullName ?? '', Validators.required],
    email: [this.user()?.email ?? '', [Validators.required, Validators.email]],
    role: [this.user()?.role ?? 'operator', Validators.required],
    storeId: [this.user()?.storeId ?? ''],
    phone: [this.user()?.phone ?? ''],
    status: [this.user()?.status ?? 'active', Validators.required],
    notes: [this.user()?.notes ?? '', Validators.maxLength(500)],
  });

  protected readonly isLoading = signal(false);
  protected readonly isSuccess = signal(false);

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const raw = this.form.getRawValue();
    const selectedStore = this.stores().find((s) => s.id === raw.storeId);
    this.userService.update(this.userId, {
      fullName: raw.fullName,
      email: raw.email,
      role: raw.role as UserRole,
      status: raw.status as UserStatus,
      storeId: raw.storeId || undefined,
      storeName: selectedStore?.name ?? this.user()?.storeName ?? undefined,
      phone: raw.phone || undefined,
      notes: raw.notes || undefined,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
    });
  }
}
