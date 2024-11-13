// src/stores/inventoryStore.js
import { create } from 'zustand'

// Constants for max item limits
const MAX_LIMITS = {
  ships: 5,
  tokens: 99,
  pills: 99
}

export const useInventoryStore = create((set) => ({
  // Initial state
  items: {
    ships: 3,
    tokens: 0,
    pills: 0
  },

  // Actions
  addItem: (itemType, amount = 1) =>
    set((state) => ({
      items: {
        ...state.items,
        [itemType]: Math.min(
          state.items[itemType] + amount,
          MAX_LIMITS[itemType]
        )
      }
    })),

  useItem: (itemType) =>
    set((state) => {
      if (state.items[itemType] <= 0) return state

      return {
        items: {
          ...state.items,
          [itemType]: state.items[itemType] - 1
        }
      }
    }),

  // Reset inventory
  resetInventory: () =>
    set({
      items: {
        ships: 3,
        tokens: 0,
        pills: 0
      }
    })
}))
