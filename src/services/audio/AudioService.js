// src/services/audio/AudioService.js
import AudioEventEmitter from './AudioEventEmitter'
import { AUDIO_CONFIG } from './AudioConfig'
import { VOLUME_CHANNELS } from './AudioTypes'

class AudioService {
  constructor(config) {
    this.config = config
    this.sounds = new Map()
    this.music = new Map()
    this.currentMusic = null
    this.eventEmitter = new AudioEventEmitter()
    this.volumes = { ...config.defaultVolumes }
    this.initialized = false
    this.effectSettings = { ...config.effectSettings }
    this.loadSettings() // Load saved settings on initialization
  }

  // Music Methods
  async loadMusic(id, config) {
    const audio = new Audio(config.path)
    audio.volume = 0
    audio.loop = config.loop

    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve)
      audio.addEventListener('error', reject)
      audio.load()
    })

    this.music.set(id, { audio, config })
  }

  async playMusic(id, options = {}) {
    if (!this.initialized) {
      console.log('Attempted to play music before initialization:', id)
      return
    }

    const music = this.music.get(id)
    if (!music) {
      console.warn(`Music track not found: ${id}`)
      return
    }

    try {
      console.log(`Playing music: ${id}`, { options })

      // Stop current music if playing
      if (this.currentMusic && this.currentMusic !== music) {
        await this.stopMusic(this.currentMusic.id, { fadeOut: true })
      }

      const { audio, config } = music
      audio.volume = this.calculateVolume('music') * config.volume
      audio.loop = options.loop ?? config.loop

      if (options.fadeIn) {
        await this.fadeIn(audio, config.fadeInDuration || 1000)
      } else {
        await audio.play()
      }

      this.currentMusic = { id, audio, config }
      this.eventEmitter.emit('musicStarted', id)
    } catch (error) {
      console.error(`Error playing music ${id}:`, error)
      this.eventEmitter.emit('error', { type: 'playMusic', id, error })
    }
  }

  async stopMusic(id, options = {}) {
    const music = this.music.get(id)
    if (!music) {
      console.warn(`Attempted to stop non-existent music: ${id}`)
      return
    }


    try {
      console.log(`Stopping music: ${id}`, { options })
      const { audio } = music

      if (options.fadeOut) {
        await this.fadeOut(audio)
      }

      audio.pause()
      audio.currentTime = 0

      if (this.currentMusic?.id === id) {
        this.currentMusic = null
      }

      this.eventEmitter.emit('musicStopped', id)
    } catch (error) {
      console.error(`Error stopping music ${id}:`, error)
      this.eventEmitter.emit('error', { type: 'stopMusic', id, error })
    }
  }

  async transitionMusic(fromId, toId, options = {}) {
    const fromMusic = this.music.get(fromId)
    const toMusic = this.music.get(toId)

    if (!fromMusic || !toMusic) {
      console.warn('One or both music tracks not found for transition')
      return
    }

    try {
      const duration = options.crossFadeDuration || 1000

      // Start new music at 0 volume
      toMusic.audio.volume = 0
      await toMusic.audio.play()

      // Cross-fade
      await Promise.all([
        this.fadeOut(fromMusic.audio, duration),
        this.fadeIn(toMusic.audio, duration)
      ])

      // Clean up old music
      fromMusic.audio.pause()
      fromMusic.audio.currentTime = 0

      this.currentMusic = { id: toId, ...toMusic }
      this.eventEmitter.emit('musicTransitioned', { from: fromId, to: toId })
    } catch (error) {
      this.eventEmitter.emit('error', { type: 'transitionMusic', error })
    }
  }

  // Effect Settings Methods
  setEffectSetting(effectType, setting) {
    if (this.effectSettings.hasOwnProperty(effectType)) {
      this.effectSettings[effectType] = setting
      this.saveSettings()
      this.eventEmitter.emit('effectSettingChanged', { effectType, setting })
    }
  }

  // Settings Persistence
  saveSettings() {
    try {
      const settings = {
        volumes: this.volumes,
        effectSettings: this.effectSettings
      }
      localStorage.setItem('audioSettings', JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save audio settings:', error)
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('audioSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        this.volumes = { ...this.volumes, ...settings.volumes }
        this.effectSettings = { ...this.effectSettings, ...settings.effectSettings }
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error)
    }
  }

  resetSettings() {
    // Reset to default values from config
    this.volumes = { ...this.config.defaultVolumes }
    this.effectSettings = { ...this.config.effectSettings }

    // Update all audio volumes
    this.updateAllVolumes()

    // Save the reset settings
    this.saveSettings()

    // Emit events for UI updates
    Object.entries(this.volumes).forEach(([channel, value]) => {
      this.eventEmitter.emit('volumeChanged', { channel, value })
    })

    Object.entries(this.effectSettings).forEach(([effectType, setting]) => {
      this.eventEmitter.emit('effectSettingChanged', { effectType, setting })
    })

    this.eventEmitter.emit('settingsReset')
  }

  // Utility Methods
  async fadeIn(audio, duration = 1000) {
    const targetVolume = audio.volume
    audio.volume = 0
    await audio.play()

    return new Promise(resolve => {
      const steps = duration / 50
      const volumeStep = targetVolume / steps
      let currentStep = 0

      const fadeInterval = setInterval(() => {
        currentStep++
        audio.volume = Math.min(targetVolume, volumeStep * currentStep)

        if (currentStep >= steps) {
          clearInterval(fadeInterval)
          resolve()
        }
      }, 50)
    })
  }

  async fadeOut(audio, duration = 1000) {
    const startVolume = audio.volume
    return new Promise(resolve => {
      const steps = duration / 50
      const volumeStep = startVolume / steps
      let currentStep = 0

      const fadeInterval = setInterval(() => {
        currentStep++
        audio.volume = Math.max(0, startVolume - (volumeStep * currentStep))

        if (currentStep >= steps) {
          clearInterval(fadeInterval)
          resolve()
        }
      }, 50)
    })
  }

  async init(onProgress = () => { }) {
    if (this.initialized) return

    try {
      // Calculate total assets (both sounds and music)
      const totalAssets = Object.keys(this.config.sounds).length +
        Object.keys(this.config.music).length
      let loadedAssets = 0

      const updateProgress = () => {
        loadedAssets++
        const progress = (loadedAssets / totalAssets) * 100
        onProgress(progress)
      }

      // Load sound effects
      await Promise.all(
        Object.entries(this.config.sounds).map(([id, config]) =>
          this.loadSound(id, config).then(updateProgress)
        )
      )

      // Load music tracks
      await Promise.all(
        Object.entries(this.config.music).map(([id, config]) =>
          this.loadMusic(id, config).then(updateProgress)
        )
      )

      this.initialized = true
      console.log('Audio system initialized with:', {
        sounds: Array.from(this.sounds.keys()),
        music: Array.from(this.music.keys())
      })
      this.eventEmitter.emit('initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize audio system:', error)
      this.eventEmitter.emit('error', error)
      throw error
    }
  }

  async loadSound(id, config) {
    try {
      const audio = new Audio(config.path)
      audio.volume = 0

      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve)
        audio.addEventListener('error', reject)
        audio.load()
      })

      this.sounds.set(id, { audio, config })
    } catch (error) {
      console.error(`Failed to load sound: ${id}`, error)
      throw error
    }
  }

  async playSound(id) {
    if (!this.initialized) {
      console.warn('Audio system not initialized')
      return
    }

    const sound = this.sounds.get(id)
    if (!sound) {
      console.warn(`Sound not found: ${id}`)
      return
    }

    try {
      const { audio, config } = sound
      audio.volume = this.calculateVolume(config.category) * config.volume

      if (audio.currentTime > 0) {
        audio.currentTime = 0
      }

      await audio.play()
      this.eventEmitter.emit('soundPlayed', id)
    } catch (error) {
      this.eventEmitter.emit('error', { type: 'playSound', id, error })
    }
  }

  setVolume(channel, value) {
    if (!Object.values(VOLUME_CHANNELS).includes(channel)) {
      console.warn(`Invalid volume channel: ${channel}`)
      return
    }

    const normalizedValue = Math.max(0, Math.min(1, value))
    this.volumes[channel] = normalizedValue

    // Update all active audio
    this.updateAllVolumes()

    this.eventEmitter.emit('volumeChanged', { channel, value: normalizedValue })
  }

  updateAllVolumes() {
    // Update sound effects
    this.sounds.forEach(({ audio, config }) => {
      audio.volume = this.calculateVolume(config.category) * config.volume
    })

    // Update music if playing
    if (this.currentMusic) {
      const music = this.music.get(this.currentMusic)
      if (music) {
        music.audio.volume = this.calculateVolume('music') * music.config.volume
      }
    }
  }

  calculateVolume(category) {
    return this.volumes[VOLUME_CHANNELS.MASTER] * this.volumes[category]
  }

  // Event handling methods
  on(event, callback) {
    return this.eventEmitter.on(event, callback)
  }

  off(event, callback) {
    this.eventEmitter.off(event, callback)
  }

  // Cleanup method
  destroy() {
    this.sounds.forEach(({ audio }) => {
      audio.pause()
      audio.src = ''
    })
    this.sounds.clear()
    this.music.clear()
    this.initialized = false
  }
}

// Create and export singleton instance
export const audioService = new AudioService(AUDIO_CONFIG)

// Initialize on import
audioService.init()