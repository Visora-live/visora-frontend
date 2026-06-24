import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { RecoveryService } from '../../../core/services/recovery.service';

type LegalModal = 'terms' | 'privacy' | 'support';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly recovery = inject(RecoveryService);

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    description: ['', Validators.required],
  });

  protected readonly isLoading = signal(false);
  protected readonly isSubmitted = signal(false);
  protected readonly submitError = signal('');

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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.submitError.set('');

    const v = this.form.getRawValue();
    this.recovery
      .create({
        identificador: v.identifier.trim(),
        celular: v.phone.trim() || undefined,
        email: v.email.trim(),
        descripcion: v.description.trim(),
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isSubmitted.set(true);
        },
        error: () => {
          this.isLoading.set(false);
          this.submitError.set(
            'No se pudo enviar la solicitud. Revisa tu conexión e intenta de nuevo.',
          );
        },
      });
  }
}
