// src/stores/levelStore.js
import { create } from 'zustand'

export const useLevelStore = create((set) => ({
  level: 1,
  levelProgress: 0,
  levelRequirement: 5, // Base requirement for level advancement

  incrementLevel: () => set((state) => ({
    level: state.level + 1,
    levelProgress: 0,
    levelRequirement: Math.floor(state.levelRequirement * 1.5) // Increase requirement each level
  })),

  updateProgress: () => set((state) => {
    const newProgress = state.levelProgress + 1
    if (newProgress >= state.levelRequirement) {
      return {
        level: state.level + 1,
        levelProgress: 0,
        levelRequirement: Math.floor(state.levelRequirement * 1.5)
      }
    }
    return { levelProgress: newProgress }
  }),

  resetLevel: () => set({
    level: 1,
    levelProgress: 0,
    levelRequirement: 5
  })
}))
