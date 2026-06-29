import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, startWith } from 'rxjs/operators';
import { timer } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { RecoveryService } from '../../core/services/recovery.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { AlertService } from '../../core/services/alert.service';

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
  private readonly alertSvc = inject(AlertService);
  protected readonly storeCtx = inject(StoreContextService);

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
  protected readonly activeStoreName = computed(
    () => this.storeCtx.stores().find((s) => s.id === this.storeCtx.activeStoreId())?.name ?? '',
  );
  protected readonly unreadNotifs = this.recovery.unread;

  // Poll unread-count every 30s — single lightweight request vs the 3-request list()
  protected readonly unreadAlerts = toSignal(
    toObservable(this.storeCtx.activeStoreId).pipe(
      switchMap((id) =>
        timer(0, 30_000).pipe(
          switchMap(() => this.alertSvc.unreadCount(id)),
          startWith(0),
        ),
      ),
    ),
    { initialValue: 0 },
  );

  /** Whether the store-picker popup is open. */
  protected readonly showPicker = signal(false);

  constructor() {
    effect(() => {
      if (this.isAdmin()) {
        this.recovery.refreshUnread();
        this.storeCtx.clear();
      } else if (this.currentUser()) {
        this.storeCtx.init();
      }
    });
  }

  protected togglePicker(): void {
    this.showPicker.update((v) => !v);
  }

  protected selectStore(storeId: string): void {
    this.showPicker.set(false);
    if (storeId === this.storeCtx.activeStoreId()) return;
    this.storeCtx.switchTo(storeId, () => void this.router.navigate(['/dashboard']));
  }

  /** For propietario: navigate to their active store detail, not the list. */
  protected readonly storeRoute = computed(() => {
    const id = this.storeCtx.activeStoreId();
    return !this.isAdmin() && id ? `/stores/${id}` : '/stores';
  });

  private readonly allNavItems: NavItem[] = [
    { label: 'Inicio',   icon: 'dashboard',    route: '/dashboard', ownerOnly: true },
    { label: 'Tiendas',  icon: 'store',         route: '/stores' },
    { label: 'Cámaras',  icon: 'videocam',      route: '/cameras',  ownerOnly: true },
    { label: 'Eventos',  icon: 'event_note',    route: '/events',   ownerOnly: true },
    { label: 'Alertas',  icon: 'notifications', route: '/alerts',   ownerOnly: true },
    { label: 'Usuarios',   icon: 'group',         route: '/users',     adminOnly: true },
    { label: 'Algoritmo', icon: 'functions',     route: '/algorithm', adminOnly: true },
  ];

  protected readonly navItems = computed(() =>
    this.allNavItems.filter((item) => {
      if (item.adminOnly)  return  this.isAdmin();
      if (item.ownerOnly)  return !this.isAdmin();
      return true;
    }),
  );

  protected logout(): void {
    this.storeCtx.clear();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
