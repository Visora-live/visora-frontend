import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type AlertToastSeverity = 'normal' | 'suspicious' | 'critical';

export interface AlertToastData {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: AlertToastSeverity;
  createdAt: string;
  leida: boolean;
}

@Component({
  selector: 'app-alert-toast',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './alert-toast.html',
  styleUrl: './alert-toast.scss',
})
export class AlertToastComponent {
  readonly data = input.required<AlertToastData>();
  readonly closed = output<void>();

  protected close(event: Event): void {
    event.stopPropagation();
    this.closed.emit();
  }

  protected severityIcon(s: AlertToastSeverity): string {
    if (s === 'critical') return 'error';
    if (s === 'suspicious') return 'warning';
    return 'notifications';
  }
}
