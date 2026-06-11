import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { UserRole, UserStatus } from '../../../core/models/user.model';
import { MOCK_STORES } from '../../stores/stores.mock';
import { UserService } from '../../../core/services/user.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-user-new',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PageHeaderComponent,
  ],
  templateUrl: './user-new.html',
  styleUrl: './user-new.scss',
})
export class UserNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  protected readonly stores = MOCK_STORES;

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['operator', Validators.required],
    storeId: [''],
    phone: [''],
    status: ['active', Validators.required],
    notes: ['', Validators.maxLength(500)],
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
    const selectedStore = this.stores.find((s) => s.id === raw.storeId);
    this.userService.create({
      fullName: raw.fullName,
      email: raw.email,
      role: raw.role as UserRole,
      status: raw.status as UserStatus,
      storeId: raw.storeId || undefined,
      storeName: selectedStore?.name || undefined,
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
