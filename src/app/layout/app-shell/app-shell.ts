import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { SidebarComponent } from '../sidebar/sidebar';
import { StoreContextService } from '../../core/services/store-context.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MatSidenavModule, MatIconModule, SidebarComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShellComponent {
  protected readonly storeCtx = inject(StoreContextService);
}
