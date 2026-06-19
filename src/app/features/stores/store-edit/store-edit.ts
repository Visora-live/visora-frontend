import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { StoreStatus } from '../../../core/models/store.model';
import { StoreService } from '../../../core/services/store.service';
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
  private readonly storeService = inject(StoreService);

  protected readonly storeId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly store = toSignal(this.storeService.getById(this.storeId), {
    initialValue: null,
  });

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    ruc: [''],
    status: ['active', Validators.required],
  });

  protected readonly isLoading = signal(false);
  protected readonly isSuccess = signal(false);

  constructor() {
    effect(() => {
      const s = this.store();
      if (s) {
        this.form.patchValue({
          name: s.name,
          address: s.address,
          ruc: s.ruc ?? '',
          status: s.status,
        });
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const raw = this.form.getRawValue();
    this.storeService
      .update(this.storeId, {
        name: raw.name,
        address: raw.address,
        ruc: raw.ruc || undefined,
        status: raw.status as StoreStatus,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isSuccess.set(true);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }
}
