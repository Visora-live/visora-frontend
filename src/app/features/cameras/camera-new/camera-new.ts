import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MOCK_STORES } from '../../stores/stores.mock';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-camera-new',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PageHeaderComponent,
  ],
  templateUrl: './camera-new.html',
  styleUrl: './camera-new.scss',
})
export class CameraNewComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly stores = MOCK_STORES;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    storeId: ['', Validators.required],
    location: ['', Validators.required],
    ipUrl: ['', [Validators.required, Validators.pattern(/^\d{1,3}(\.\d{1,3}){3}$/)]],
    resolution: ['1080p', Validators.required],
    status: ['online', Validators.required],
    capFacialRecognition: [false],
    capWeaponDetection: [false],
    capRecording: [true],
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
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSuccess.set(true);
    }, 1200);
  }
}
