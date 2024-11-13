// src/stores/powerupStore.js
import { create } from 'zustand'

export const usePowerupStore = create((set) => ({
  // State
  powerups: {
    invincible: false,
    rapidFire: false
  },

  // Actions
  activatePowerups: () => set({
    powerups: {
      invincible: true,
      rapidFire: true
    }
  }),

  deactivatePowerups: () => set({
    powerups: {
      invincible: false,
      rapidFire: false
    }
  })
}))
