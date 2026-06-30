import { Component, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

export interface EventScore {
  event_id: number;
  fecha_hora: string;
  c_arma: number;
  c_rostro: number;
  i_rostro: number;
  s_score: number;
  infractor_nombre: string | null;
  infractor_apellido: string | null;
  infractor_dni: string | null;
}

export interface CameraReport {
  camera_id: number;
  camera_name: string;
  location: string;
  tienda_nombre: string;
  total_events: number;
  identified_events: number;
  avg_score: number;
  max_score: number;
  events: EventScore[];
}

export interface AlgorithmReport {
  alpha: number;
  beta: number;
  cameras: CameraReport[];
}

@Component({
  selector: 'app-algorithm-score',
  imports: [MatIconModule, MatButtonModule, DatePipe, DecimalPipe, PageHeaderComponent],
  templateUrl: './algorithm-score.html',
  styleUrl: './algorithm-score.scss',
})
export class AlgorithmScoreComponent {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  protected readonly report = toSignal(
    this.http.get<AlgorithmReport>(`${this.base}/algorithm/report`).pipe(
      catchError(() => of(null)),
    ),
    { initialValue: null },
  );

  protected readonly totalEvents = computed(() =>
    this.report()?.cameras.reduce((a, c) => a + c.total_events, 0) ?? 0,
  );

  protected readonly totalIdentified = computed(() =>
    this.report()?.cameras.reduce((a, c) => a + c.identified_events, 0) ?? 0,
  );

  protected readonly globalAvg = computed(() => {
    const cams = this.report()?.cameras ?? [];
    if (!cams.length) return 0;
    const allScores = cams.flatMap((c) => c.events.map((e) => e.s_score));
    return allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  });

  protected scoreColor(s: number): string {
    if (s >= 0.85) return '#dc2626'; // --visora-status-critical
    if (s >= 0.7)  return '#d97706'; // --visora-status-suspicious
    if (s >= 0.5)  return '#2f88f5'; // --visora-accent
    return '#16a34a';                // --visora-status-normal
  }

  protected scoreBg(s: number): string {
    if (s >= 0.85) return '#fee2e2'; // --visora-status-critical-bg
    if (s >= 0.7)  return '#fef3c7'; // --visora-status-suspicious-bg
    if (s >= 0.5)  return 'rgba(47,136,245,0.10)';
    return '#dcfce7';               // --visora-status-normal-bg
  }

  protected scoreLabel(s: number): string {
    if (s >= 0.85) return 'Crítico';
    if (s >= 0.7)  return 'Alto';
    if (s >= 0.5)  return 'Medio';
    return 'Bajo';
  }
}
