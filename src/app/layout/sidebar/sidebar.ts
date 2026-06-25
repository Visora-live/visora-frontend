import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  ownerOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  private readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));

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
}
