import { Component, computed, inject, output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { catchError, filter, map, of, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Panel principal',
  stores: 'Tiendas',
  cameras: 'Cámaras',
  events: 'Eventos',
  alerts: 'Alertas',
  users: 'Usuarios',
};

@Component({
  selector: 'app-topbar',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class TopbarComponent {
  readonly menuToggle = output<void>();

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.titleFromUrl(this.router.url)),
      startWith(this.titleFromUrl(this.router.url)),
    ),
    { initialValue: '' },
  );

  private readonly currentUser = toSignal(
    this.auth.getCurrentUser().pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  protected readonly displayName = computed(() => this.currentUser()?.username ?? '—');
  protected readonly displayRole = computed(() => this.currentUser()?.rol_nombre ?? '');
  protected readonly avatarInitials = computed(() => {
    const u = this.currentUser()?.username;
    return u ? u.slice(0, 2).toUpperCase() : '—';
  });

  protected onMenuToggle(): void {
    this.menuToggle.emit();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private titleFromUrl(url: string): string {
    const segment = url.split('?')[0].split('/')[1];
    return PAGE_TITLES[segment] ?? '';
  }
}
