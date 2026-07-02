import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
  OnDestroy,
} from '@angular/core';
import Hls from 'hls.js';
import { MatIconModule } from '@angular/material/icon';

type PlayerState = 'loading' | 'playing' | 'offline';

@Component({
  selector: 'app-hls-player',
  imports: [MatIconModule],
  template: `
    <div class="hls-wrap">
      <video
        #video
        class="hls-video"
        [class.hls-video--hidden]="!enabled() || state() !== 'playing'"
        muted
        playsinline
        autoplay
      ></video>

      @if (!enabled()) {
        <div class="hls-overlay" aria-hidden="true">
          <mat-icon>videocam_off</mat-icon>
          <span class="hls-msg">Cámara inactiva</span>
        </div>
      } @else if (state() !== 'playing') {
        <div class="hls-overlay" aria-hidden="true">
          @if (state() === 'loading') {
            <span class="hls-spinner"></span>
            <span class="hls-msg">Conectando…</span>
          } @else {
            <mat-icon>videocam_off</mat-icon>
            <span class="hls-msg">SIN SEÑAL</span>
          }
        </div>
      } @else {
        <span class="hls-live" aria-hidden="true">
          <span class="hls-dot"></span>EN VIVO
        </span>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; height: 100%; }
      .hls-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        background: #0a0e1a;
        overflow: hidden;
      }
      .hls-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .hls-video--hidden { visibility: hidden; }
      .hls-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        mat-icon { font-size: 34px; width: 34px; height: 34px; }
      }
      .hls-spinner {
        width: 26px; height: 26px; border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.18);
        border-top-color: #fff;
        animation: hls-spin 0.9s linear infinite;
      }
      @keyframes hls-spin { to { transform: rotate(360deg); } }
      .hls-live {
        position: absolute;
        top: 8px; left: 8px;
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 9px;
        font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
        color: #fff; background: rgba(22, 163, 74, 0.85);
        border-radius: 999px;
      }
      .hls-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; }
      @media (prefers-reduced-motion: reduce) { .hls-spinner { animation: none; } }
    `,
  ],
})
export class HlsPlayerComponent implements OnDestroy {
  readonly src = input.required<string>();
  readonly enabled = input(true);

  protected readonly state = signal<PlayerState>('loading');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');
  private readonly isVisible = signal(false);
  private hls?: Hls;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private attachedUrl = '';
  private onPlayingFn?: () => void;
  private observer?: IntersectionObserver;

  constructor() {
    effect(() => {
      const hlsUrl = this.src();
      const video = this.videoRef()?.nativeElement;
      if (!video) return;
      if (this.enabled() && this.isVisible() && hlsUrl) {
        if (hlsUrl !== this.attachedUrl) this.attach(video, hlsUrl);
      } else {
        this.teardown();
      }
    });

    afterNextRender(() => {
      this.observer = new IntersectionObserver(
        (entries) => this.isVisible.set(entries[0]?.isIntersecting ?? false),
        { threshold: 0.1 },
      );
      this.observer.observe(this.host.nativeElement);
    });
  }

  private attach(video: HTMLVideoElement, hlsUrl: string): void {
    this.teardown();
    this.attachedUrl = hlsUrl;
    this.state.set('loading');

    video.muted = true;
    video.volume = 0;
    video.defaultMuted = true;

    this.attachHls(video, hlsUrl);
  }

  private attachHls(video: HTMLVideoElement, url: string): void {
    this.onPlayingFn = () => this.state.set('playing');
    video.addEventListener('playing', this.onPlayingFn);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5,
        maxLiveSyncPlaybackRate: 1.5,
        maxBufferLength: 20,
        backBufferLength: 10,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 6,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 6,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        xhrSetup: (xhr) => { xhr.withCredentials = true; },
      });
      this.hls = hls;
      let mediaRecoveries = 0;
      let networkRetries = 0;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => {}));
      hls.on(Hls.Events.FRAG_LOADED, () => { mediaRecoveries = 0; networkRetries = 0; });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 3) {
          mediaRecoveries++;
          hls.recoverMediaError();
        } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
          // Common while the camera hasn't started publishing yet (m3u8 still 404).
          // Cap retries on this same Hls instance — if it still can't load after a
          // few tries, fall through to fail() below, which tears down and rebuilds
          // the whole instance. Relying on startLoad() forever can get stuck.
          networkRetries++;
          hls.startLoad();
        } else {
          this.fail();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => void video.play().catch(() => {}));
      video.addEventListener('error', () => this.fail());
    } else {
      this.fail();
    }
  }

  private fail(): void {
    this.state.set('offline');
    this.hls?.destroy();
    this.hls = undefined;
    const url = this.attachedUrl;
    this.attachedUrl = '';
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      const video = this.videoRef()?.nativeElement;
      if (video && url && this.enabled() && this.isVisible()) this.attach(video, url);
    }, 5000);
  }

  private teardown(): void {
    clearTimeout(this.retryTimer);
    const video = this.videoRef()?.nativeElement;
    if (video && this.onPlayingFn) {
      video.removeEventListener('playing', this.onPlayingFn);
      this.onPlayingFn = undefined;
    }
    this.hls?.destroy();
    this.hls = undefined;
    this.attachedUrl = '';
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.teardown();
  }
}
