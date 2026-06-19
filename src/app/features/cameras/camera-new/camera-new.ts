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
import type { CameraStatus } from '../../../core/models/camera.model';
import { CameraService } from '../../../core/services/camera.service';
import { StoreService } from '../../../core/services/store.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-camera-new',
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
  templateUrl: './camera-new.html',
  styleUrl: './camera-new.scss',
})
export class CameraNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cameraService = inject(CameraService);
  private readonly storeService = inject(StoreService);

  private readonly storeListRes = toSignal(this.storeService.list(), { initialValue: { items: [], total: 0 } });
  protected readonly stores = computed(() => this.storeListRes().items);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    storeId: ['', Validators.required],
    location: ['', Validators.required],
    ipUrl: ['', [Validators.required, Validators.pattern(/^\d{1,3}(\.\d{1,3}){3}$/)]],
    port: [8080, [Validators.required, Validators.min(1), Validators.max(65535)]],
    status: ['online', Validators.required],
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
    const selectedStore = this.stores().find((s) => s.id === raw.storeId);
    this.cameraService
      .create({
        name: raw.name,
        storeId: raw.storeId,
        storeName: selectedStore?.name ?? '',
        location: raw.location,
        ipUrl: raw.ipUrl,
        port: raw.port,
        status: raw.status as CameraStatus,
      })
      .subscribe({
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
