class SoundManager {
  static instance = null;
  sounds = {};
  volume = 0.5;

  constructor() {
    if (SoundManager.instance) {
      return SoundManager.instance;
    }
    SoundManager.instance = this;
    this.init();
  }

  init() {
    // Initialize sounds
    this.loadSound('thrust', '/sounds/thrust.wav');
    this.loadSound('shoot', '/sounds/shoot.wav');
    this.loadSound('explosion', '/sounds/explosion.wav');
    this.loadSound('quarterInsert', '/sounds/coin.wav');
  }

  loadSound(name, url, options = {}) {
    try {
      const audio = new Audio(url);
      audio.volume = this.volume;

      if (options.loop) {
        audio.loop = true;
      }

      this.sounds[name] = {
        audio,
        isPlaying: false,
        ...options
      };
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  play(name) {
    try {
      const sound = this.sounds[name];
      if (!sound) return;

      if (!sound.loop) {
        sound.audio.currentTime = 0;
        sound.audio.play().catch(error => {
          console.warn(`Error playing sound ${name}:`, error);
        });
        return;
      }

      if (!sound.isPlaying) {
        sound.audio.play().catch(error => {
          console.warn(`Error playing sound ${name}:`, error);
        });
        sound.isPlaying = true;
      }
    } catch (error) {
      console.warn(`Error in play(${name}):`, error);
    }
  }

  stop(name) {
    try {
      const sound = this.sounds[name];
      if (!sound) return;

      sound.audio.pause();
      sound.audio.currentTime = 0;
      sound.isPlaying = false;
    } catch (error) {
      console.warn(`Error in stop(${name}):`, error);
    }
  }

  stopAll() {
    try {
      Object.keys(this.sounds).forEach(name => {
        this.stop(name);
      });
    } catch (error) {
      console.warn('Error in stopAll:', error);
    }
  }

  setVolume(volume) {
    try {
      this.volume = Math.max(0, Math.min(1, volume));
      Object.values(this.sounds).forEach(sound => {
        sound.audio.volume = this.volume;
      });
    } catch (error) {
      console.warn('Error in setVolume:', error);
    }
  }
}

// Create and export a single instance
export const soundManager = new SoundManager();
