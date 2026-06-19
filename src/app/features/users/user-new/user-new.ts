import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { UserStatus } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { StoreService } from '../../../core/services/store.service';
import { RoleService } from '../../../core/services/role.service';
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
  private readonly storeService = inject(StoreService);
  private readonly roleService = inject(RoleService);

  private readonly storeListRes = toSignal(this.storeService.list(), { initialValue: { items: [], total: 0 } });
  protected readonly stores = computed(() => this.storeListRes().items);

  private readonly roleListRes = toSignal(this.roleService.list(), { initialValue: [] });
  protected readonly roles = computed(() => this.roleListRes());

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roleId: [0, [Validators.required, Validators.min(1)]],
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
    this.userService.create({
      fullName: raw.fullName,
      email: raw.email,
      password: raw.password,
      roleId: raw.roleId,
      status: raw.status as UserStatus,
      storeId: raw.storeId || undefined,
      phone: raw.phone || undefined,
      notes: raw.notes || undefined,
    }).subscribe({
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
