
// Audio and Haptic Utility for Anglix
// Using standard Web Audio API and vibration API

class AudioService {
  private static instance: AudioService;
  private sounds: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;

  private constructor() {
    // Preload common sounds from reliable CDNs
    this.sounds = {
      click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
      success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
      error: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
      levelUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
      gemOpen: new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'),
      explosion: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'),
      pop: new Audio('https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3')
    };

    // Set volumes
    Object.values(this.sounds).forEach(s => {
      s.volume = 0.4;
    });
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public play(soundName: keyof typeof this.sounds) {
    if (!this.enabled) return;
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.log('Audio play blocked:', e));
    }
  }

  public haptic(pattern: number | number[] = 50) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const audio = AudioService.getInstance();
