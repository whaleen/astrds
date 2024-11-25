// src/stores/powerupStore.ts
import { create } from 'zustand'
import { PowerupStore, PowerupState } from '@/types/stores/powerup'

const initialState: PowerupState = {
  powerups: {
    invincible: false,
    rapidFire: false,
  },
}

export const usePowerupStore = create<PowerupStore>((set) => ({
  ...initialState,

  // Actions
  activatePowerups: () =>
    set({
      powerups: {
        invincible: true,
        rapidFire: true,
      },
    }),

  deactivatePowerups: () =>
    set({
      powerups: {
        invincible: false,
        rapidFire: false,
      },
    }),

  activatePowerup: (type: string) =>
    set((state) => ({
      powerups: {
        ...state.powerups,
        [type]: true,
      },
    })),
}))
