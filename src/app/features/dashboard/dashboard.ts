import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { BadgeStatus } from '../../shared/components/status-badge/status-badge';
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

  private readonly metrics = toSignal(this.service.getMetrics(), { initialValue: null });

  protected readonly recentAlerts = toSignal(this.service.getRecentAlerts(5), { initialValue: [] });
  protected readonly recentEvents = toSignal(this.service.getRecentEvents(5), { initialValue: [] });

  // Stat cards
  protected readonly activeStores = computed(() => this.metrics()?.activeStores ?? 0);
  protected readonly onlineCameras = computed(() => this.metrics()?.onlineCameras ?? 0);
  protected readonly openAlerts = computed(() => this.metrics()?.openAlerts ?? 0);
  protected readonly totalEvents = computed(() => this.metrics()?.totalEvents ?? 0);

  // System status
  protected readonly offlineCameras = computed(() => this.metrics()?.offlineCameras ?? 0);
  protected readonly maintenanceCameras = computed(() => this.metrics()?.maintenanceCameras ?? 0);
  protected readonly criticalAlerts = computed(() => this.metrics()?.criticalAlerts ?? 0);
  protected readonly suspiciousEvents = computed(() => this.metrics()?.suspiciousEvents ?? 0);

  protected severityBadge(severity: string): BadgeStatus {
    const map: Record<string, BadgeStatus> = {
      critical: 'critical',
      suspicious: 'suspicious',
      normal: 'normal',
    };
    return map[severity] ?? 'normal';
  }
}
