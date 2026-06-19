import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { BadgeStatus } from '../../shared/components/status-badge/status-badge';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  private readonly currentUser = toSignal(this.auth.getCurrentUser(), { initialValue: null });
  protected readonly isAdmin = computed(() => this.auth.isAdminRole(this.currentUser()?.rol_tipo));
  protected readonly dashSubtitle = computed(() =>
    this.isAdmin()
      ? 'Resumen operativo del sistema de videovigilancia VISORA.'
      : 'Vista general de tus tiendas y alertas asignadas.',
  );

  private readonly data = toSignal(this.service.getAll(5), { initialValue: null });

  protected readonly recentAlerts = computed(() => this.data()?.recentAlerts ?? []);
  protected readonly recentEvents = computed(() => this.data()?.recentEvents ?? []);

  // Stat cards
  protected readonly activeStores = computed(() => this.data()?.metrics.activeStores ?? 0);
  protected readonly onlineCameras = computed(() => this.data()?.metrics.onlineCameras ?? 0);
  protected readonly openAlerts = computed(() => this.data()?.metrics.openAlerts ?? 0);
  protected readonly totalEvents = computed(() => this.data()?.metrics.totalEvents ?? 0);

  // System status
  protected readonly offlineCameras = computed(() => this.data()?.metrics.offlineCameras ?? 0);
  protected readonly maintenanceCameras = computed(() => this.data()?.metrics.maintenanceCameras ?? 0);
  protected readonly criticalAlerts = computed(() => this.data()?.metrics.criticalAlerts ?? 0);
  protected readonly suspiciousEvents = computed(() => this.data()?.metrics.suspiciousEvents ?? 0);

  protected severityBadge(severity: string): BadgeStatus {
    const map: Record<string, BadgeStatus> = {
      critical: 'critical',
      suspicious: 'suspicious',
      normal: 'normal',
    };
    return map[severity] ?? 'normal';
  }
}
