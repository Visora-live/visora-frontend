import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly showPassword = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly submitError = signal('');

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    this.submitError.set('');

    // Simulated auth — no backend yet
    setTimeout(() => {
      this.isLoading.set(false);
      this.submitError.set(
        'Credenciales incorrectas. Verifica tus datos e intenta de nuevo.',
      );
    }, 1500);
  }
}
