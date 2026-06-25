import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { RecoveryService } from '../../core/services/recovery.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  ownerOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, MatBadgeModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly recovery = inject(RecoveryService);

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));
  protected readonly avatarInitials = computed(() => {
    const u = this.currentUser()?.username;
    return u ? u.slice(0, 2).toUpperCase() : '—';
  });
  protected readonly userTooltip = computed(() => {
    const u = this.currentUser()?.username ?? '';
    const r = this.currentUser()?.rol_tipo;
    const role = r === 'admin' ? 'Administrador' : r === 'propietario' ? 'Propietario' : (r ?? '');
    return `${u} · ${role}`;
  });
  protected readonly unreadNotifs = this.recovery.unread;

  constructor() {
    effect(() => {
      if (this.isAdmin()) this.recovery.refreshUnread();
    });
  }

  private readonly allNavItems: NavItem[] = [
    { label: 'Inicio',   icon: 'dashboard',    route: '/dashboard', ownerOnly: true },
    { label: 'Tiendas',  icon: 'store',         route: '/stores' },
    { label: 'Cámaras',  icon: 'videocam',      route: '/cameras',  ownerOnly: true },
    { label: 'Eventos',  icon: 'event_note',    route: '/events',   ownerOnly: true },
    { label: 'Alertas',  icon: 'notifications', route: '/alerts',   ownerOnly: true },
    { label: 'Usuarios', icon: 'group',         route: '/users',    adminOnly: true },
  ];

  protected readonly navItems = computed(() =>
    this.allNavItems.filter((item) => {
      if (item.adminOnly)  return  this.isAdmin();
      if (item.ownerOnly)  return !this.isAdmin();
      return true;
    }),
  );

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
