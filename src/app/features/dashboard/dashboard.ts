import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { BadgeStatus } from '../../shared/components/status-badge/status-badge';
import { MOCK_STORES } from '../stores/stores.mock';
import { MOCK_CAMERAS } from '../cameras/cameras.mock';
import { MOCK_EVENTS } from '../events/events.mock';
import { MOCK_ALERTS } from '../alerts/alerts.mock';
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
  // ── Stat card values ─────────────────────────────────────────────────────────
  protected readonly activeStores = MOCK_STORES.filter((s) => s.status === 'active').length;
  protected readonly onlineCameras = MOCK_CAMERAS.filter((c) => c.status === 'online').length;
  protected readonly openAlerts = MOCK_ALERTS.filter((a) => a.status === 'open').length;
  protected readonly totalEvents = MOCK_EVENTS.length;

  // ── System status ────────────────────────────────────────────────────────────
  protected readonly offlineCameras = MOCK_CAMERAS.filter((c) => c.status === 'offline').length;
  protected readonly maintenanceCameras = MOCK_CAMERAS.filter((c) => c.status === 'maintenance').length;
  protected readonly criticalAlerts = MOCK_ALERTS.filter(
    (a) => a.severity === 'critical' && a.status === 'open',
  ).length;
  protected readonly suspiciousEvents = MOCK_EVENTS.filter((e) => e.severity === 'suspicious').length;

  // ── Recent data ───────────────────────────────────────────────────────────────
  protected readonly recentAlerts = [...MOCK_ALERTS]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  protected readonly recentEvents = [...MOCK_EVENTS]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5);

  protected severityBadge(severity: string): BadgeStatus {
    const map: Record<string, BadgeStatus> = {
      critical: 'critical',
      suspicious: 'suspicious',
      normal: 'normal',
    };
    return map[severity] ?? 'normal';
  }
}
