import { Component, inject, output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { toSignal } from '@angular/core/rxjs-interop';

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

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.titleFromUrl(this.router.url)),
      startWith(this.titleFromUrl(this.router.url)),
    ),
    { initialValue: '' },
  );

  protected onMenuToggle(): void {
    this.menuToggle.emit();
  }

  protected logout(): void {
    void this.router.navigate(['/login']);
  }

  private titleFromUrl(url: string): string {
    const segment = url.split('?')[0].split('/')[1];
    return PAGE_TITLES[segment] ?? '';
  }
}
