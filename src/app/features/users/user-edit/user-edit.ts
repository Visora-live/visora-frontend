import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MOCK_USERS } from '../users.mock';
import { MOCK_STORES } from '../../stores/stores.mock';
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

  protected readonly userId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly user = MOCK_USERS.find((u) => u.id === this.userId) ?? null;
  protected readonly stores = MOCK_STORES;

  protected readonly form = this.fb.nonNullable.group({
    fullName: [this.user?.fullName ?? '', Validators.required],
    email: [this.user?.email ?? '', [Validators.required, Validators.email]],
    role: [this.user?.role ?? 'operator', Validators.required],
    storeId: [this.user?.storeId ?? ''],
    phone: [this.user?.phone ?? ''],
    status: [this.user?.status ?? 'active', Validators.required],
    notes: [this.user?.notes ?? '', Validators.maxLength(500)],
  });

  protected readonly isLoading = signal(false);
  protected readonly isSuccess = signal(false);

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSuccess.set(true);
    }, 1200);
  }
}
