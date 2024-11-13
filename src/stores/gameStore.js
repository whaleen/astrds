// src/stores/gameStore.js
import { create } from 'zustand'

export const useGameStore = create((set) => ({
  isPaused: false,
  gameState: 'INITIAL',
  score: 0,

  togglePause: () => set((state) => {
    // Only toggle if in playing state
    return { isPaused: !state.isPaused }
  }),

  setGameState: (newState) => set({
    gameState: newState,
    isPaused: false // Reset pause when changing game state
  }),

  resetGame: () => set({
    isPaused: false,
    gameState: 'INITIAL',
    score: 0
  })
}))
