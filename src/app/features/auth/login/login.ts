import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

type LegalModal = 'terms' | 'privacy' | 'support';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly showPassword = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly isRedirecting = signal(false);
  protected readonly submitError = signal('');

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  // ── Legal / support modal ───────────────────────────────────────────────
  protected readonly activeModal = signal<LegalModal | null>(null);

  protected openModal(modal: LegalModal): void {
    this.activeModal.set(modal);
  }

  protected closeModal(): void {
    this.activeModal.set(null);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.activeModal()) this.closeModal();
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    this.submitError.set('');

    const { identifier, password } = this.form.getRawValue();
    this.auth.login(identifier, password).subscribe({
      next: () => {
        // Keep the form locked and show a branded loader through the redirect.
        this.isRedirecting.set(true);
        setTimeout(() => void this.router.navigate(['/dashboard']), 900);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.submitError.set('Credenciales incorrectas. Verifica tus datos e intenta de nuevo.');
        } else if (err.status === 403) {
          this.submitError.set('Tu cuenta está inactiva. Contacta al administrador.');
        } else {
          this.submitError.set('Error de conexión. Intenta de nuevo más tarde.');
        }
      },
    });
  }
}
