// src/stores/gameStore.js
import { create } from 'zustand'
import { submitScore, getHighScores } from '../api/scores'

export const useGameStore = create((set, get) => ({
  isPaused: false,
  gameState: 'INITIAL',
  score: 0,
  topScore: 0,

  updateScore: (newScore) => {
    const validScore = Math.max(0, parseInt(newScore) || 0)
    set({ score: validScore })
  },

  addToScore: (points) => {
    const validPoints = Math.max(0, parseInt(points) || 0)
    set((state) => ({
      score: state.score + validPoints
    }))
  },

  // Submit final score to the API
  submitFinalScore: async (walletAddress) => {
    if (!walletAddress) return

    const currentScore = get().score
    if (currentScore <= 0) return

    try {
      const updatedScores = await submitScore(currentScore, walletAddress)
      set({ topScore: updatedScores[0]?.score || 0 })
      return updatedScores
    } catch (error) {
      console.error('Error submitting score:', error)
    }
  },

  togglePause: () => set((state) => ({
    isPaused: !state.isPaused
  })),

  setGameState: (newState) => set({
    gameState: newState,
    isPaused: false
  }),

  resetGame: () => set({
    isPaused: false,
    gameState: 'INITIAL',
    score: 0
  })
}))
