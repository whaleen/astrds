// src/sounds/SoundManager.js

class Sound {
  constructor(url, options = {}) {
    this.audio = new Audio(url);
    this.audio.volume = 0;
    this.isPlaying = false;
    this.fadeInterval = null;
    this.loopInterval = null;
    this.category = options.category || 'sfx';
    this.effectType = options.effectType || null;
    this.volumeLevel = options.volumeLevel || 'normal';
    this.options = {
      loop: false,
      fadeInDuration: 1000,
      fadeOutDuration: 1000,
      loopStart: null,
      loopEnd: null,
      onEnd: null,
      ...options
    };
  }

  // Calculate final volume based on master, channel, and effect volumes
  updateVolume(volumes, effectSettings) {
    const masterVolume = volumes.master;
    const channelVolume = volumes[this.category];

    // Get effect volume multiplier based on settings
    let effectMultiplier = 1;
    if (this.category === 'sfx' && effectSettings[this.effectType]) {
      switch (effectSettings[this.effectType]) {
        case 'off':
          effectMultiplier = 0;
          break;
        case 'quiet':
          effectMultiplier = 0.5;
          break;
        case 'normal':
          effectMultiplier = 1;
          break;
      }
    }

    // Combine all volume factors
    const finalVolume = masterVolume * channelVolume * effectMultiplier;
    this.audio.volume = Math.max(0, Math.min(1, finalVolume));

  }

  async fadeIn(targetVolume) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    let volume = this.audio.volume;
    const step = (targetVolume - volume) / (this.options.fadeInDuration / 50);

    return new Promise(resolve => {
      this.fadeInterval = setInterval(() => {
        volume = Math.min(volume + step, targetVolume);
        this.audio.volume = volume;

        if (volume >= targetVolume) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          resolve();
        }
      }, 50);
    });
  }

  async fadeOut() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    let volume = this.audio.volume;
    const step = volume / (this.options.fadeOutDuration / 50);

    return new Promise(resolve => {
      this.fadeInterval = setInterval(() => {
        volume = Math.max(volume - step, 0);
        this.audio.volume = volume;

        if (volume <= 0) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          resolve();
        }
      }, 50);
    });
  }

  setupLooping() {
    if (this.loopInterval) clearInterval(this.loopInterval);

    if (this.options.loopStart !== null && this.options.loopEnd !== null) {
      this.audio.currentTime = this.options.loopStart;

      this.loopInterval = setInterval(() => {
        if (this.audio.currentTime >= this.options.loopEnd) {
          this.audio.currentTime = this.options.loopStart;
        }
      }, 10);
    } else if (this.options.loop) {
      this.audio.loop = true;
    }
  }

  clearLooping() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.audio.loop = false;
  }
}

class SoundManager {
  constructor() {
    if (SoundManager.instance) return SoundManager.instance;

    SoundManager.instance = this;
    this.volumes = {
      master: 0.5,
      music: 0.5,
      sfx: 0.5
    };
    this.effectSettings = {
      shoot: 'normal',
      explosion: 'normal',
      thrust: 'normal',
      collect: 'normal',
      quarterInsert: 'normal',
      countdownPing: 'normal',
      gameOver: 'normal',
      spaceWind: 'normal'
    };
    this.sounds = new Map();
    this.music = new Map();
    this.initialized = false;
    this.currentMusic = null;

    // Try to load saved settings
    this.loadSettings();
  }


  async init(onProgress = () => { }) {
    if (this.initialized) return;
    console.log('Initializing SoundManager...');

    try {
      const totalAssets = 12; // Total number of sounds to load
      let loadedAssets = 0;

      const updateProgress = () => {
        loadedAssets++;
        const progress = (loadedAssets / totalAssets) * 100;
        onProgress(progress);
      };

      // Sound effects with progress tracking
      await Promise.all([
        this.loadSoundEffect('thrust', '/sounds/thrust.wav')
          .then(updateProgress),
        this.loadSoundEffect('shoot', '/sounds/shoot.wav')
          .then(updateProgress),
        this.loadSoundEffect('explosion', '/sounds/explosion.wav')
          .then(updateProgress),
        this.loadSoundEffect('collect', '/sounds/collect-pill.mp3')
          .then(updateProgress),
        this.loadSoundEffect('quarterInsert', '/sounds/coin.wav')
          .then(updateProgress),
        this.loadSoundEffect('countdownPing', '/sounds/ping.wav')
          .then(updateProgress),
        this.loadSoundEffect('gameOver', '/sounds/gameover.wav')
          .then(updateProgress),
        this.loadSoundEffect('spaceWind', '/sounds/space-wind.wav')
          .then(updateProgress)
      ]);

      // Music tracks with progress tracking
      await Promise.all([
        this.loadMusic('titleMusic', '/sounds/arcis.mp3')
          .then(updateProgress),
        this.loadMusic('readyMusic', '/sounds/ready.wav')
          .then(updateProgress),
        this.loadMusic('gameMusic', '/sounds/arcis.mp3')
          .then(updateProgress),
        this.loadMusic('gameOverMusic', '/sounds/arcis.mp3')
          .then(updateProgress)
      ]);

      this.initialized = true;
      console.log('SoundManager initialized successfully');
      onProgress(100);
    } catch (error) {
      console.error('Error initializing SoundManager:', error);
      throw error;
    }
  }

  async loadSoundEffect(name, url, options = {}) {
    try {
      console.log(`Loading sound effect: ${name}`);
      // Create a Sound instance instead of raw Audio
      const sound = new Sound(url, {
        category: 'sfx',
        effectType: name,
        ...options
      });

      await new Promise((resolve, reject) => {
        sound.audio.addEventListener('canplaythrough', resolve);
        sound.audio.addEventListener('error', reject);
        sound.audio.load();
      });

      this.sounds.set(name, sound);  // Store Sound instance
      console.log(`Sound effect loaded: ${name}`);
    } catch (error) {
      console.error(`Error loading sound effect ${name}:`, error);
    }
  }

  async loadMusic(name, url, options = {}) {
    try {
      console.log(`Loading music track: ${name}`);
      // Create a Sound instance instead of raw Audio
      const music = new Sound(url, {
        category: 'music',
        effectType: name,
        ...options
      });

      await new Promise((resolve, reject) => {
        music.audio.addEventListener('canplaythrough', resolve);
        music.audio.addEventListener('error', reject);
        music.audio.load();
      });

      this.music.set(name, music);  // Store Sound instance
      console.log(`Music track loaded: ${name}`);
    } catch (error) {
      console.error(`Error loading music track ${name}:`, error);
    }
  }

  setVolume(channel, value) {
    const normalizedValue = Math.max(0, Math.min(1, value));
    this.volumes[channel] = normalizedValue;

    // Update all sound volumes
    const updateVolume = (sound) => {
      if (sound instanceof Sound) {
        sound.updateVolume(this.volumes, this.effectSettings);
      } else if (sound instanceof Audio) {
        // Legacy support for plain Audio objects
        sound.volume = this.calculateVolume(channel, normalizedValue);
      }
    };

    this.sounds.forEach(updateVolume);
    this.music.forEach(updateVolume);
  }

  setEffectSetting(effectType, setting) {
    if (this.effectSettings.hasOwnProperty(effectType)) {
      this.effectSettings[effectType] = setting;

      // Update volumes for affected sounds
      this.sounds.forEach(sound => {
        if (sound.effectType === effectType) {
          sound.updateVolume(this.volumes, this.effectSettings);
        }
      });
    }
  }

  calculateVolume(channel, value) {
    const masterVolume = this.volumes.master;
    const channelVolume = this.volumes[channel];
    return masterVolume * channelVolume * value;
  }

  getSettings() {
    return {
      volumes: { ...this.volumes },
      effectSettings: { ...this.effectSettings }
    };
  }

  saveSettings() {
    try {
      localStorage.setItem('soundSettings', JSON.stringify({
        volumes: this.volumes,
        effectSettings: this.effectSettings
      }));
    } catch (error) {
      console.error('Failed to save sound settings:', error);
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('soundSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.volumes = { ...this.volumes, ...settings.volumes };
        this.effectSettings = { ...this.effectSettings, ...settings.effectSettings };
      }
    } catch (error) {
      console.error('Failed to load sound settings:', error);
    }
  }

  async playSound(name) {
    console.log('Attempting to play sound:', name);
    try {
      const sound = this.sounds.get(name);
      if (!sound) {
        console.warn(`Sound not found: ${name}`);
        return;
      }

      // Now sound is a Sound instance, not an Audio element
      sound.updateVolume(this.volumes, this.effectSettings);

      if (sound.audio.currentTime > 0) {
        sound.audio.currentTime = 0;
      }

      await sound.audio.play();
    } catch (error) {
      console.error(`Error playing sound ${name}:`, error);
    }
  }

  async playMusic(name, options = {}) {
    console.log('Attempting to play music:', name, options);
    try {
      const music = this.music.get(name);
      if (!music) {
        console.warn(`Music track not found: ${name}`);
        return;
      }

      // Stop current music if playing
      if (this.currentMusic && this.currentMusic !== music) {
        await this.stopMusic(this.currentMusic.effectType);
      }

      music.updateVolume(this.volumes, this.effectSettings);
      music.audio.loop = options.loop !== false;

      await music.audio.play();
      this.currentMusic = music;

      console.log('Music playing:', {
        track: name,
        volume: music.audio.volume,
        loop: music.audio.loop
      });
    } catch (error) {
      console.error(`Error playing music ${name}:`, error);
    }
  }

  async stopMusic(name, options = {}) {
    try {
      const music = this.music.get(name);
      if (!music) {
        console.warn(`Music track not found: ${name}`);
        return;
      }

      if (options.fadeOut) {
        await this.fadeOut(music);
      }

      music.pause();
      music.currentTime = 0;

      if (this.currentMusic === music) {
        this.currentMusic = null;
      }
    } catch (error) {
      console.error(`Error stopping music ${name}:`, error);
    }
  }

  fadeIn(audio, duration = 1000) {
    let volume = 0;
    const increment = this.volume / (duration / 50);
    const fadeInterval = setInterval(() => {
      volume = Math.min(volume + increment, this.volume);
      audio.volume = volume;
      if (volume >= this.volume) {
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  async fadeOut(audio, duration = 1000) {
    return new Promise(resolve => {
      let volume = audio.volume;
      const decrement = volume / (duration / 50);
      const fadeInterval = setInterval(() => {
        volume = Math.max(0, volume - decrement);
        audio.volume = volume;
        if (volume <= 0) {
          clearInterval(fadeInterval);
          resolve();
        }
      }, 50);
    });
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => sound.volume = this.volume);
    this.music.forEach(music => music.volume = this.volume);
  }

  stopAll() {
    this.sounds.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    this.music.forEach(music => {
      music.pause();
      music.currentTime = 0;
    });
  }

  transitionMusic(fromName, toName, options = {}) {
    return new Promise(async (resolve) => {
      try {
        const fromMusic = this.music.get(fromName);
        const toMusic = this.music.get(toName);

        if (!fromMusic || !toMusic) {
          console.warn('One or both music tracks not found for transition');
          resolve();
          return;
        }

        // Start new music at 0 volume
        toMusic.volume = 0;
        toMusic.loop = options.loop !== false;
        await toMusic.play();

        // Crossfade
        const duration = options.crossFadeDuration || 1000;
        const steps = duration / 50;
        const volumeStep = this.volume / steps;

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
          currentStep++;
          fromMusic.volume = Math.max(0, this.volume - (volumeStep * currentStep));
          toMusic.volume = Math.min(this.volume, volumeStep * currentStep);

          if (currentStep >= steps) {
            clearInterval(fadeInterval);
            fromMusic.pause();
            fromMusic.currentTime = 0;
            this.currentMusic = toMusic;
            resolve();
          }
        }, 50);
      } catch (error) {
        console.error('Error transitioning music:', error);
        resolve();
      }
    });
  }
}

// Create and export a single instance
export const soundManager = new SoundManager();

// Initialize the sound manager immediately
soundManager.init();
