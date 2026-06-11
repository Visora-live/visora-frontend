import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MOCK_CAMERAS } from '../cameras.mock';
import { MOCK_STORES } from '../../stores/stores.mock';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-camera-edit',
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
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './camera-edit.html',
  styleUrl: './camera-edit.scss',
})
export class CameraEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly cameraId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly camera = MOCK_CAMERAS.find((c) => c.id === this.cameraId) ?? null;
  protected readonly stores = MOCK_STORES;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.camera?.name ?? '', Validators.required],
    storeId: [this.camera?.storeId ?? '', Validators.required],
    location: [this.camera?.location ?? '', Validators.required],
    ipUrl: [
      this.camera?.ipUrl ?? '',
      [Validators.required, Validators.pattern(/^\d{1,3}(\.\d{1,3}){3}$/)],
    ],
    resolution: [this.camera?.resolution ?? '1080p', Validators.required],
    status: [this.camera?.status ?? 'online', Validators.required],
    capFacialRecognition: [this.camera?.capabilities.facialRecognition ?? false],
    capWeaponDetection: [this.camera?.capabilities.weaponDetection ?? false],
    capRecording: [this.camera?.capabilities.recording ?? true],
    notes: [this.camera?.notes ?? '', Validators.maxLength(500)],
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
