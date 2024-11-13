// src/stores/gameStore.js
import { create } from 'zustand'
import { submitScore, getHighScores } from '../api/scores'

export const useGameStore = create((set, get) => ({
  isPaused: false,
  gameState: 'INITIAL', // INITIAL -> READY_TO_PLAY -> PLAYING -> GAME_OVER -> LEADERBOARD
  score: 0,
  topScore: 0,
  lastGameStats: null,

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

  // Pause functionality
  togglePause: () => set(
    (state) => ({ isPaused: !state.isPaused }),
    false,
    'togglePause'
  ),

  setPause: (paused) => set(
    { isPaused: paused },
    false,
    'setPause'
  ),

  setGameState: (newState) => set(
    (state) => ({
      gameState: newState,
      isPaused: false, // Reset pause when changing game state
      ...(newState === 'READY_TO_PLAY' ? { score: 0, lastGameStats: null } : {})
    }),
    false,
    'setGameState'
  ),

  // Submit final score to the API
  submitFinalScore: async (walletAddress) => {
    if (!walletAddress) return null

    const currentScore = get().score
    if (currentScore <= 0) return null

    try {
      // Submit score and get updated leaderboard
      const updatedScores = await submitScore(currentScore, walletAddress)

      if (Array.isArray(updatedScores) && updatedScores.length > 0) {
        // Find player's rank
        const playerRank = updatedScores.findIndex(s => s.walletAddress === walletAddress) + 1

        // Update store with latest scores and stats
        set({
          topScore: updatedScores[0]?.score || 0,
          lastGameStats: {
            score: currentScore,
            rank: playerRank,
            isHighScore: playerRank === 1,
            totalPlayers: updatedScores.length
          }
        })

        return updatedScores
      }
      return null
    } catch (error) {
      console.error('Error submitting score:', error)
      return null
    }
  },

  resetGame: () => set({
    isPaused: false,
    gameState: 'INITIAL',
    score: 0,
    lastGameStats: null
  })
}))
