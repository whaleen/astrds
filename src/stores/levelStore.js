// src/stores/levelStore.js
import { create } from 'zustand'

export const useLevelStore = create((set) => ({
  // State
  level: 1,

  // Actions
  incrementLevel: () => set((state) => ({
    level: state.level + 1
  })),

  resetLevel: () => set({
    level: 1
  })
}))
