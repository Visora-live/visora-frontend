import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StoreMin { id: string; name: string; }

const ACTIVE_STORE_KEY = 'visora_active_store';

@Injectable({ providedIn: 'root' })
export class StoreContextService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  readonly stores = signal<StoreMin[]>([]);
  readonly activeStoreId = signal<string | null>(null);
  readonly isSwitching = signal(false);
  /** True only when propietario has 2+ active stores. */
  readonly showSwitcher = computed(() => this.stores().length >= 2);

  /** Load propietario's active stores from API. Call once on login/init. */
  init(): void {
    this.http
      .get<{ id: number; nombre: string; estado_tienda: boolean }[]>(`${this.base}/stores`)
      .pipe(catchError(() => of([])))
      .subscribe((raw) => {
        const mapped: StoreMin[] = raw
          .filter((s) => s.estado_tienda)
          .map((s) => ({ id: String(s.id), name: s.nombre }));
        this.stores.set(mapped);

        const saved = localStorage.getItem(ACTIVE_STORE_KEY);
        const valid = mapped.find((s) => s.id === saved);
        if (valid) {
          this.activeStoreId.set(valid.id);
        } else if (mapped.length > 0) {
          this.activeStoreId.set(mapped[0].id);
          localStorage.setItem(ACTIVE_STORE_KEY, mapped[0].id);
        } else {
          this.activeStoreId.set(null);
        }
      });
  }

  /** Switch to a different store with a brief loading animation. */
  switchTo(storeId: string, navigate: () => void): void {
    this.isSwitching.set(true);
    this.activeStoreId.set(storeId);
    localStorage.setItem(ACTIVE_STORE_KEY, storeId);
    setTimeout(() => {
      navigate();
      setTimeout(() => this.isSwitching.set(false), 200);
    }, 700);
  }

  /** Clear context on logout. */
  clear(): void {
    localStorage.removeItem(ACTIVE_STORE_KEY);
    this.stores.set([]);
    this.activeStoreId.set(null);
    this.isSwitching.set(false);
  }
}
