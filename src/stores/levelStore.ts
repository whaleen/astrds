// src/stores/levelStore.ts
import { create } from 'zustand'
import { audioService } from '../services/audio/AudioService'
import { useInventoryStore } from './inventoryStore'

type LevelStoreState = {
  level: number
  isLevelTransition: boolean
  isRespawning: boolean
}

type LevelStoreActions = {
  incrementLevel: () => void
  handleShipDestroyed: () => Promise<boolean>
  resetLevel: () => void
}

export const useLevelStore = create<LevelStoreState & LevelStoreActions>(
  (set, get) => ({
    level: 1,
    isLevelTransition: false,
    isRespawning: false,

    // Level management
    incrementLevel: () => {
      console.log('Incrementing level...') // Add this line

      set((state) => ({
        level: state.level + 1,
        isLevelTransition: true,
      }))
      console.log('New level:', get().level) // Add this line

      // Hide level message after 2 seconds
      setTimeout(() => set({ isLevelTransition: false }), 2000)
    },

    // Ship destruction handling
    handleShipDestroyed: async () => {
      const inventoryStore = useInventoryStore.getState()
      const remainingShips = inventoryStore.items.ships

      if (remainingShips > 0) {
        // Use a ship from inventory
        inventoryStore.useItem('ships')
        set({ isRespawning: true })

        // Respawn after 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000))
        set({ isRespawning: false })

        return true // Continue game
      } else {
        // Game Over
        audioService.playSound('gameOver')
        return false // End game
      }
    },

    // Reset state
    resetLevel: () => {
      set({
        level: 1,
        isLevelTransition: false,
        isRespawning: false,
      })
    },
  })
)

export default useLevelStore
