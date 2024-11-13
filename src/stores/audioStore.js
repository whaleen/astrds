// src/stores/audioStore.js
import { create } from 'zustand'
import { soundManager } from '../sounds/SoundManager'

export const useAudioStore = create((set, get) => ({
  // State
  volume: 0.5,
  isMuted: false,
  currentMusic: null,

  // Actions
  setVolume: (volume) => {
    const newVolume = Math.max(0, Math.min(1, volume))
    soundManager.setVolume(newVolume)
    set({ volume: newVolume })
  },

  toggleMute: () => {
    const isMuted = !get().isMuted
    soundManager.setVolume(isMuted ? 0 : get().volume)
    set({ isMuted })
  },

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

  playSound: (soundName) => {
    soundManager.playSound(soundName)
  }
}))
