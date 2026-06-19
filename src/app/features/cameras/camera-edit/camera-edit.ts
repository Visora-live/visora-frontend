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
import type { CameraStatus } from '../../../core/models/camera.model';
import { CameraService } from '../../../core/services/camera.service';
import { StoreService } from '../../../core/services/store.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-camera-edit',
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
  templateUrl: './camera-edit.html',
  styleUrl: './camera-edit.scss',
})
export class CameraEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cameraService = inject(CameraService);
  private readonly storeService = inject(StoreService);

  protected readonly cameraId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly camera = toSignal(this.cameraService.getById(this.cameraId), {
    initialValue: null,
  });

  private readonly storeListRes = toSignal(this.storeService.list(), {
    initialValue: { items: [], total: 0 },
  });
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

  constructor() {
    effect(() => {
      const c = this.camera();
      if (c) {
        this.form.patchValue({
          name: c.name,
          storeId: c.storeId,
          location: c.location,
          ipUrl: c.ipUrl,
          port: c.port ?? 8080,
          status: c.status,
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
    const selectedStore = this.stores().find((s) => s.id === raw.storeId);
    this.cameraService
      .update(this.cameraId, {
        name: raw.name,
        storeId: raw.storeId,
        storeName: selectedStore?.name ?? this.camera()?.storeName ?? '',
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
