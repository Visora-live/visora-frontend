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
    ruc: ['', Validators.required],
  });

  // Step 2 — assign a propietario (required).
  protected readonly selectedUserId = signal<number | null>(null);
  protected readonly userTouched = signal(false);
  protected readonly userError = computed(() => this.userTouched() && !this.selectedUserId());

  private readonly usersRes = toSignal(this.userService.list(), { initialValue: null });
  protected readonly propietarios = computed(() =>
    (this.usersRes()?.items ?? [])
      .filter((u) => u.role === 'propietario')
      .map((u) => ({ id: Number(u.id), name: u.fullName })),
  );
  protected readonly selectedUserName = computed(
    () => this.propietarios().find((u) => u.id === this.selectedUserId())?.name ?? 'Sin asignar',
  );

  protected readonly isLoading = signal(false);
  protected readonly isSuccess = signal(false);

  protected validateUserStep(): boolean {
    this.userTouched.set(true);
    return this.selectedUserId() !== null;
  }

  protected onCreate(): void {
    if (this.form.invalid || !this.selectedUserId() || this.isLoading()) {
      this.form.markAllAsTouched();
      this.userTouched.set(true);
      return;
    }
    this.isLoading.set(true);
    const raw = this.form.getRawValue();
    this.storeService
      .create({
        name: raw.name,
        address: raw.address,
        ruc: raw.ruc,
        usuarioId: this.selectedUserId()!,
      })
      .pipe(take(1))
      .subscribe({
        next: () => this.finish(),
        error: () => this.isLoading.set(false),
      });
  }

  private finish(): void {
    this.isLoading.set(false);
    this.isSuccess.set(true);
  }
}
