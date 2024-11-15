// src/stores/levelStore.js
import { create } from 'zustand'
import { audioService } from '../services/audio/AudioService'

export const useLevelStore = create((set, get) => ({
  level: 1,
  lives: 3,
  isLevelTransition: false,
  isRespawning: false,

  // Level management
  incrementLevel: () => {
    const newLevel = get().level + 1
    set({
      level: newLevel,
      isLevelTransition: true
    })

    // Hide level message after 2 seconds
    setTimeout(() => set({ isLevelTransition: false }), 2000)
  },

  // Lives management
  handlePlayerDeath: async () => {
    const state = get()
    const remainingLives = state.lives - 1

    if (remainingLives >= 0) {
      set({
        lives: remainingLives,
        isRespawning: true
      })

      // Respawn after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))
      set({ isRespawning: false })

      return true // Continue game
    } else {
      // Game Over
      audioService.fadeOut('gameMusic', 2000)
      audioService.playSound('gameOver')

      return false // End game
    }
  },

  resetLevel: () => {
    set({
      lives: 3,
      isLevelTransition: false,
      isRespawning: false
    })
  }
}))

export default useLevelStore
