// Authentic Audio & Wedding Song Manager modeled after halaheel.com
// Uses real SFX audio recordings and official YouTube wedding zaffas with zero synthetic noise

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: unknown) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: unknown) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (vol: number) => void;
  getPlayerState: () => number;
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  destroy?: () => void;
}

export function extractYouTubeId(input: string): string {
  if (!input) return 'Hp8WTVqR_0U';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : trimmed;
}

class BabAudioManager {
  private isMusicPlaying: boolean = false;
  private ytPlayer: YTPlayerInstance | null = null;
  private currentVideoId: string = 'Hp8WTVqR_0U';
  private listeners: Set<(playing: boolean) => void> = new Set();
  private isReady: boolean = false;
  private gestured: boolean = false;
  private pendingStart: boolean = false;
  private rearmed: boolean = false;

  // Real SFX audio elements
  private knockAudio: HTMLAudioElement | null = null;
  private doorAudio: HTMLAudioElement | null = null;

  public preloadSfx() {
    try {
      if (this.knockAudio) this.knockAudio.load();
      if (this.doorAudio) this.doorAudio.load();
    } catch (_) {}
  }

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.knockAudio = new Audio('/templates/bab/assets/knock.wav');
        this.knockAudio.preload = 'auto';
        this.knockAudio.volume = 0.85;

        this.doorAudio = new Audio('/templates/bab/assets/door-open.m4a');
        this.doorAudio.preload = 'auto';
        this.doorAudio.volume = 0.9;
      } catch (_) {}

      this.setupYouTubeListener();
    }
  }

  public subscribe(fn: (playing: boolean) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isMusicPlaying));
  }

  /* Real Authentic Door Knock Sound */
  public playKnock(_knockIndex = 1) {
    try {
      if (this.knockAudio) {
        this.knockAudio.currentTime = 0;
        this.knockAudio.play().catch(() => {});
      } else {
        const audio = new Audio('/templates/bab/assets/knock.wav');
        audio.volume = 0.85;
        audio.play().catch(() => {});
      }
    } catch (_) {}
  }

  /* Real Authentic Door Opening Creak */
  public playDoorOpening() {
    try {
      if (this.doorAudio) {
        this.doorAudio.currentTime = 0;
        this.doorAudio.play().catch(() => {});
      } else {
        const audio = new Audio('/templates/bab/assets/door-open.m4a');
        audio.volume = 0.9;
        audio.play().catch(() => {});
      }
    } catch (_) {}
  }

  /* YouTube Player Setup */
  private setupYouTubeListener() {
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      const el = document.getElementById('da3wa-yt');
      if (!el || this.ytPlayer) return;

      try {
        this.ytPlayer = new window.YT.Player('da3wa-yt', {
          videoId: this.currentVideoId,
          playerVars: {
            autoplay: 0,
            mute: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: this.currentVideoId,
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            start: 0,
          },
          events: {
            onReady: () => {
              this.isReady = true;
              if (this.pendingStart) {
                this.pendingStart = false;
                this.loud();
              }
            },
            onStateChange: (event) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                this.isMusicPlaying = true;
                this.notify();
              } else if (event.data === 2 || event.data === 0) {
                this.isMusicPlaying = false;
                this.notify();
              }
            },
            onError: (err) => {
              console.warn('YouTube Player notice:', err);
            },
          },
        });
      } catch (_) {}
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }
  }

  /* Unmute and play at balanced, pleasant wedding volume */
  private loud(): boolean {
    if (!this.ytPlayer || !this.isReady) return false;
    try {
      this.ytPlayer.unMute();
      this.ytPlayer.setVolume(70);
      this.ytPlayer.playVideo();
      this.isMusicPlaying = true;
      this.notify();
      return true;
    } catch (_) {
      return false;
    }
  }

  /* Arming during user knocks (unlocks iOS Safari / Android WebKit audio permission) */
  public armMusic() {
    this.gestured = true;
    if (this.ytPlayer && this.isReady) {
      try {
        this.ytPlayer.unMute();
        setTimeout(() => {
          if (!this.isMusicPlaying && this.ytPlayer) {
            try { this.ytPlayer.mute(); } catch (_) {}
          }
        }, 250);
      } catch (_) {}
    }
  }

  /* Start the wedding zaffa upon door open */
  public startCelebrationMusic(customVideoId?: string) {
    if (customVideoId) {
      this.setVideoId(customVideoId);
    }

    this.gestured = true;
    this.isMusicPlaying = true;
    this.notify();

    if (!this.isReady || !this.ytPlayer) {
      this.pendingStart = true;
      this.rearmOnGesture();
      return;
    }

    const success = this.loud();
    if (!success) {
      this.rearmOnGesture();
    }
  }

  /* Stop/Pause the celebration song */
  public stopCelebrationMusic() {
    this.isMusicPlaying = false;
    this.pendingStart = false;
    this.notify();

    if (this.ytPlayer) {
      try {
        this.ytPlayer.pauseVideo();
      } catch (_) {}
    }
  }

  /* Toggle play/pause from floating button or drawer */
  public toggleMusic(customVideoId?: string): boolean {
    if (this.isMusicPlaying) {
      this.stopCelebrationMusic();
      return false;
    } else {
      this.startCelebrationMusic(customVideoId);
      return true;
    }
  }

  /* Change the active wedding song */
  public setVideoId(videoId: string) {
    const cleanId = extractYouTubeId(videoId);
    if (!cleanId) return;
    const changed = cleanId !== this.currentVideoId;
    this.currentVideoId = cleanId;

    if (this.ytPlayer) {
      try {
        if (changed) {
          if (this.isMusicPlaying) {
            this.ytPlayer.loadVideoById(cleanId);
            this.ytPlayer.unMute();
            this.ytPlayer.setVolume(70);
            this.ytPlayer.playVideo();
          } else {
            this.ytPlayer.cueVideoById(cleanId);
          }
        }
      } catch (_) {}
    }
  }

  public getCurrentVideoId(): string {
    return this.currentVideoId;
  }

  public getIsPlaying(): boolean {
    return this.isMusicPlaying;
  }

  /* Gesture listener ensures first tap on mobile plays sound smoothly if autoplay was held */
  public rearmOnGesture() {
    if (this.rearmed || !this.isMusicPlaying) return;
    this.rearmed = true;

    const onUserTouch = () => {
      document.removeEventListener('click', onUserTouch);
      document.removeEventListener('touchstart', onUserTouch);
      this.rearmed = false;

      if (this.isMusicPlaying && this.ytPlayer) {
        this.loud();
      }
    };

    document.addEventListener('click', onUserTouch, { once: true });
    document.addEventListener('touchstart', onUserTouch, { once: true, passive: true });
  }
}

export const babAudio = new BabAudioManager();
