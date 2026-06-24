import { Component, computed, effect, inject, output } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { RecoveryService } from '../../core/services/recovery.service';

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
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class TopbarComponent {
  readonly menuToggle = output<void>();

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly recovery = inject(RecoveryService);

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.titleFromUrl(this.router.url)),
      startWith(this.titleFromUrl(this.router.url)),
    ),
    { initialValue: '' },
  );

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));

  // Unread recovery-request badge (admin only). Loaded once the role resolves to
  // admin; never polled per-navigation. Shared signal kept fresh by the
  // notifications view after marking requests as read.
  protected readonly unreadNotifs = this.recovery.unread;

  constructor() {
    effect(() => {
      if (this.isAdmin()) {
        this.recovery.refreshUnread();
      }
    });
  }

  protected readonly displayName = computed(() => this.currentUser()?.username ?? '—');
  protected readonly displayRole = computed(() => this.currentUser()?.rol_tipo ?? '');
  protected readonly roleLabel = computed(() => {
    const r = this.currentUser()?.rol_tipo;
    if (r === 'admin') return 'Administrador';
    if (r === 'propietario') return 'Propietario de tienda';
    return r ?? '';
  });
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
