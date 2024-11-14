// src/stores/audioStore.js
import { create } from 'zustand'
import { soundManager } from '../sounds/SoundManager'

export const useAudioStore = create((set, get) => ({
  // Volume States
  volumes: {
    master: 0.5,
    music: 0.5,
    sfx: 0.5
  },

  // Effect Settings
  effectSettings: {
    shoot: 'normal',      // 'off' | 'quiet' | 'normal'
    explosion: 'normal',
    thrust: 'normal',
    collect: 'normal',
    quarterInsert: 'normal',
    countdownPing: 'normal',
    gameOver: 'normal',
    spaceWind: 'normal'
  },

  // UI State
  isSettingsPanelOpen: false,
  isMuted: false,
  previousVolumes: null, // Store volumes before muting

  // Volume Control Actions
  setVolume: (channel, value) => {
    const normalizedValue = Math.max(0, Math.min(1, value))
    set(state => ({
      volumes: {
        ...state.volumes,
        [channel]: normalizedValue
      }
    }))
    soundManager.setVolume(channel, normalizedValue)
    soundManager.saveSettings()
  },

  // Shorthand for setting master volume (used by keyboard controls)
  setMasterVolume: (value) => {
    get().setVolume('master', value)
  },

  // Effect Setting Actions
  setEffectSetting: (effectType, setting) => {
    if (setting !== 'off' && setting !== 'quiet' && setting !== 'normal') {
      console.warn(`Invalid effect setting: ${setting}`)
      return
    }

    set(state => ({
      effectSettings: {
        ...state.effectSettings,
        [effectType]: setting
      }
    }))
    soundManager.setEffectSetting(effectType, setting)
    soundManager.saveSettings()
  },

  // Mute/Unmute Toggle
  toggleMute: () => {
    const state = get()
    if (state.isMuted) {
      // Restore previous volumes
      if (state.previousVolumes) {
        Object.entries(state.previousVolumes).forEach(([channel, volume]) => {
          soundManager.setVolume(channel, volume)
        })
        set({
          volumes: state.previousVolumes,
          isMuted: false,
          previousVolumes: null
        })
      }
    } else {
      // Store current volumes and mute all channels
      set(state => ({
        previousVolumes: { ...state.volumes },
        volumes: {
          master: 0,
          music: 0,
          sfx: 0
        },
        isMuted: true
      }))
      Object.keys(state.volumes).forEach(channel => {
        soundManager.setVolume(channel, 0)
      })
    }
    soundManager.saveSettings()
  },

  // Settings Panel Controls
  toggleSettingsPanel: () => set(state => ({
    isSettingsPanelOpen: !state.isSettingsPanelOpen
  })),

  // Music Playback Controls
  playMusic: (trackName, options = {}) => {
    soundManager.playMusic(trackName, options)
    set({ currentMusic: trackName })
  },

  stopMusic: (trackName, options = {}) => {
    soundManager.stopMusic(trackName, options)
    set({ currentMusic: null })
  },

  transitionMusic: async (fromTrack, toTrack, options = {}) => {
    await soundManager.transitionMusic(fromTrack, toTrack, options)
    set({ currentMusic: toTrack })
  },

  // Sound Effect Control
  playSound: (soundName) => {
    soundManager.playSound(soundName)
  },

  // Initialize audio settings from localStorage
  initializeSettings: () => {
    soundManager.loadSettings()
    const settings = soundManager.getSettings()
    set({
      volumes: settings.volumes,
      effectSettings: settings.effectSettings
    })
  },

  // Reset all settings to defaults
  resetSettings: () => {
    const defaultSettings = {
      volumes: {
        master: 0.5,
        music: 0.5,
        sfx: 0.5
      },
      effectSettings: {
        shoot: 'normal',
        explosion: 'normal',
        thrust: 'normal',
        collect: 'normal',
        quarterInsert: 'normal',
        countdownPing: 'normal',
        gameOver: 'normal',
        spaceWind: 'normal'
      }
    }

    set(defaultSettings)
    Object.entries(defaultSettings.volumes).forEach(([channel, volume]) => {
      soundManager.setVolume(channel, volume)
    })
    Object.entries(defaultSettings.effectSettings).forEach(([effect, setting]) => {
      soundManager.setEffectSetting(effect, setting)
    })
    soundManager.saveSettings()
  }
}))
