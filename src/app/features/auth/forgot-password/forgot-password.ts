import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-forgot-password',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    description: ['', [Validators.required, Validators.minLength(20)]],
  });

  protected readonly isLoading = signal(false);
  protected readonly isSubmitted = signal(false);

  protected get descLength(): number {
    return this.form.controls.description.value.length;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);

    // Simulated request — no backend yet
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSubmitted.set(true);
    }, 1500);
  }
}
