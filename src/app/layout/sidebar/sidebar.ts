import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  protected readonly navItems: NavItem[] = [
    { label: 'Tiendas', icon: 'store', route: '/stores' },
    { label: 'Cámaras', icon: 'videocam', route: '/cameras' },
    { label: 'Eventos', icon: 'event_note', route: '/events' },
    { label: 'Alertas', icon: 'notifications', route: '/alerts' },
  ];
}
