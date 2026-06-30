import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { UserStatus } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
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
  private readonly roleService = inject(RoleService);

  protected readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly user = toSignal(this.userService.getById(this.userId), {
    initialValue: null,
  });

  private readonly roleListRes = toSignal(this.roleService.list(), { initialValue: [] });
  protected readonly roles = computed(() => this.roleListRes());

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    roleId: [0, [Validators.required, Validators.min(1)]],
    status: ['active', Validators.required],
    // Optional: only changes the password when filled in.
    password: ['', Validators.minLength(8)],
  });

  protected readonly isLoading = signal(false);
  protected readonly isSuccess = signal(false);

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        this.form.patchValue({
          fullName: u.fullName,
          email: u.email,
          roleId: u.roleId ?? 0,
          status: u.status,
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
    this.userService.update(this.userId, {
      fullName: raw.fullName,
      email: raw.email,
      roleId: raw.roleId,
      status: raw.status as UserStatus,
      password: raw.password.trim() || undefined,
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
