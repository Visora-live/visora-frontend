import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { StoreStatus } from '../../../core/models/store.model';
import { StoreService } from '../../../core/services/store.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-store-new',
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
  templateUrl: './store-new.html',
  styleUrl: './store-new.scss',
})
export class StoreNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly storeService = inject(StoreService);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    manager: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
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
    this.storeService
      .create({
        name: raw.name,
        address: raw.address,
        city: raw.city,
        status: raw.status as StoreStatus,
        manager: raw.manager || undefined,
        email: raw.email || undefined,
        phone: raw.phone || undefined,
        notes: raw.notes || undefined,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isSuccess.set(true);
        },
      });
  }
}
