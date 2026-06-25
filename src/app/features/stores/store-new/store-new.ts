import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import type { StoreStatus } from '../../../core/models/store.model';
import { StoreService } from '../../../core/services/store.service';
import { UserService } from '../../../core/services/user.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-store-new',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
    PageHeaderComponent,
  ],
  templateUrl: './store-new.html',
  styleUrl: './store-new.scss',
})
export class StoreNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly storeService = inject(StoreService);
  private readonly userService = inject(UserService);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    ruc: [''],
    status: ['active', Validators.required],
  });

  // Step 2 — assign a propietario (optional).
  protected readonly selectedUserId = signal<number | null>(null);
  private readonly usersRes = toSignal(this.userService.list(), { initialValue: null });
  protected readonly propietarios = computed(() =>
    (this.usersRes()?.items ?? [])
      .filter((u) => u.role === 'propietario')
      .map((u) => ({ id: Number(u.id), name: u.fullName })),
  );
  protected readonly selectedUserName = computed(
    () => this.propietarios().find((u) => u.id === this.selectedUserId())?.name ?? 'Ninguno',
  );

  protected readonly isLoading = signal(false);
  protected readonly isSuccess = signal(false);

  protected onCreate(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const raw = this.form.getRawValue();
    this.storeService
      .create({
        name: raw.name,
        address: raw.address,
        ruc: raw.ruc || undefined,
        status: raw.status as StoreStatus,
      })
      .pipe(take(1))
      .subscribe({
        next: (store) => {
          const uid = this.selectedUserId();
          if (uid) {
            this.storeService
              .assignUser(store.id, uid)
              .pipe(take(1))
              .subscribe({
                next: () => this.finish(),
                error: () => this.finish(), // store created; assignment can be redone in detail
              });
          } else {
            this.finish();
          }
        },
        error: () => this.isLoading.set(false),
      });
  }

  private finish(): void {
    this.isLoading.set(false);
    this.isSuccess.set(true);
  }
}
