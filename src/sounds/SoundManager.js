// src/sounds/SoundManager.js

class Sound {
  constructor(url, options = {}) {
    this.audio = new Audio(url);
    this.audio.volume = 0;
    this.isPlaying = false;
    this.fadeInterval = null;
    this.loopInterval = null;
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
    this.volume = 0.5;
    this.sounds = new Map();
    this.music = new Map();
    this.initialized = false;
    this.currentMusic = null;
  }

  async init() {
    if (this.initialized) return;
    console.log('Initializing SoundManager...');

    try {
      // Sound effects
      await Promise.all([
        this.loadSoundEffect('thrust', '/sounds/thrust.wav'),
        this.loadSoundEffect('shoot', '/sounds/shoot.wav'),
        this.loadSoundEffect('explosion', '/sounds/explosion.wav'),
        this.loadSoundEffect('collect', '/sounds/collect-pill.mp3'),
        this.loadSoundEffect('quarterInsert', '/sounds/coin.wav'),
        this.loadSoundEffect('countdownPing', '/sounds/ping.wav'),
        this.loadSoundEffect('gameOver', '/sounds/gameover.wav'),
        this.loadSoundEffect('spaceWind', '/sounds/space-wind.wav')

      ]);

      // Music tracks
      await Promise.all([
        this.loadMusic('titleMusic', '/sounds/title-theme.mp3'),
        this.loadMusic('readyMusic', '/sounds/ready.wav'),
        this.loadMusic('gameMusic', '/sounds/game-music.mp3'),
        this.loadMusic('gameOverMusic', '/sounds/game-over.mp3')
      ]);

      this.initialized = true;
      console.log('SoundManager initialized successfully');
    } catch (error) {
      console.error('Error initializing SoundManager:', error);
    }
  }

  async loadSoundEffect(name, url) {
    try {
      console.log(`Loading sound effect: ${name}`);
      const audio = new Audio(url);
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve);
        audio.addEventListener('error', reject);
        audio.load();
      });
      this.sounds.set(name, audio);
      console.log(`Sound effect loaded: ${name}`);
    } catch (error) {
      console.error(`Error loading sound effect ${name}:`, error);
    }
  }

  async loadMusic(name, url) {
    try {
      console.log(`Loading music track: ${name}`);
      const audio = new Audio(url);
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve);
        audio.addEventListener('error', reject);
        audio.load();
      });
      this.music.set(name, audio);
      console.log(`Music track loaded: ${name}`);
    } catch (error) {
      console.error(`Error loading music track ${name}:`, error);
    }
  }

  async playSound(name) {
    try {
      const sound = this.sounds.get(name);
      if (!sound) {
        console.warn(`Sound not found: ${name}`);
        return;
      }

      sound.volume = this.volume;
      sound.currentTime = 0;
      await sound.play();
    } catch (error) {
      console.error(`Error playing sound ${name}:`, error);
    }
  }

  async playMusic(name, options = {}) {
    try {
      const music = this.music.get(name);
      if (!music) {
        console.warn(`Music track not found: ${name}`);
        return;
      }

      // Stop current music if playing
      if (this.currentMusic && this.currentMusic !== music) {
        await this.stopMusic(this.currentMusic.dataset.name);
      }

      music.dataset.name = name;
      music.volume = options.fadeIn ? 0 : this.volume;
      music.loop = options.loop !== false;

      await music.play();
      this.currentMusic = music;

      if (options.fadeIn) {
        this.fadeIn(music);
      }
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
