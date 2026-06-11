import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MOCK_STORES } from '../stores.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-store-edit',
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
  templateUrl: './store-edit.html',
  styleUrl: './store-edit.scss',
})
export class StoreEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly storeId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly store = MOCK_STORES.find((s) => s.id === this.storeId) ?? null;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.store?.name ?? '', Validators.required],
    address: [this.store?.address ?? '', Validators.required],
    city: [this.store?.city ?? '', Validators.required],
    manager: [this.store?.manager ?? '', Validators.required],
    email: [this.store?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.store?.phone ?? ''],
    status: [this.store?.status ?? 'active', Validators.required],
    notes: [this.store?.notes ?? '', Validators.maxLength(500)],
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
