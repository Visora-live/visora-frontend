import { Injectable, computed, signal } from '@angular/core';
import type { CameraConnectionStatus } from '../models/camera.model';

/**
 * Holds the single live IP-Webcam connection for the current SPA session.
 *
 * Policy: only ONE camera can be connected at a time. Connecting a new camera
 * automatically replaces (disconnects) the previous one. The connection lives
 * in this root-singleton, so it survives navigation between sections and is
 * only cleared when the user presses "Desconectar". A full page reload loses
 * it (acceptable — no persistence/localStorage by design).
 */
export interface ActiveCameraConnection {
  cameraId: string;
  streamUrl: string;
  snapshotUrl: string;
  reachable: boolean;
  connectedAt: number;
}

@Injectable({ providedIn: 'root' })
export class CameraConnectionStateService {
  private readonly _active = signal<ActiveCameraConnection | null>(null);

  /** Currently connected camera, or null. */
  readonly active = this._active.asReadonly();
  readonly activeCameraId = computed(() => this._active()?.cameraId ?? null);

  isCameraConnected(cameraId: string): boolean {
    return this._active()?.cameraId === cameraId;
  }

  getStreamUrl(cameraId: string): string {
    const a = this._active();
    return a && a.cameraId === cameraId ? a.streamUrl : '';
  }

  /** Connect a camera from a successful connection test. Replaces any previous. */
  connectCamera(cameraId: string, conn: CameraConnectionStatus): void {
    if (!conn.reachable || !conn.streamUrl) return;
    this._active.set({
      cameraId,
      streamUrl: conn.streamUrl,
      snapshotUrl: conn.snapshotUrl,
      reachable: conn.reachable,
      connectedAt: Date.now(),
    });
  }

  /** Disconnect a specific camera (no-op if it isn't the active one). */
  disconnectCamera(cameraId: string): void {
    if (this._active()?.cameraId === cameraId) this._active.set(null);
  }

  disconnectActiveCamera(): void {
    this._active.set(null);
  }
}
