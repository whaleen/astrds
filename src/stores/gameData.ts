// src/stores/gameData.ts
import { create } from 'zustand'
import { submitScore } from '../api/scores'
import { Score } from '@/types/core'
import {
  GameStore,
  GameStoreState,
  GameError,
  GameStats,
  TokenEarned,
} from '@/types/stores/game'

const initialState: GameStoreState = {
  isProcessing: false,
  score: 0,
  topScore: 0,
  lastGameStats: null,
  error: null,
  currentSessionId: null,
  sessionTokens: [],
}

export const useGameData = create<GameStore>((set, get) => ({
  ...initialState,

  // Existing score methods
  updateScore: (score: number) => {
    try {
      const validScore = Math.max(0, score)
      set((state) => ({
        score: validScore,
        topScore: Math.max(state.topScore, validScore),
        error: null,
      }))
    } catch (err) {
      set((state) => ({
        ...state,
        error: {
          code: 'SCORE_UPDATE_ERROR',
          message: 'Failed to update score',
          details: err,
        },
      }))
    }
  },

  addToScore: (points: number) => {
    try {
      const validPoints = Math.max(0, points)
      set((state) => ({
        score: state.score + validPoints,
        error: null,
      }))
    } catch (err) {
      set((state) => ({
        ...state,
        error: {
          code: 'SCORE_ADD_ERROR',
          message: 'Failed to add points',
          details: err,
        },
      }))
    }
  },

  submitFinalScore: async (walletAddress: string): Promise<Score[] | null> => {
    if (!walletAddress) return null

    const currentScore = get().score
    if (currentScore <= 0) return null

    set({ isProcessing: true, error: null })

    try {
      const updatedScores = await submitScore(currentScore, walletAddress)

      if (Array.isArray(updatedScores) && updatedScores.length > 0) {
        const playerRank =
          updatedScores.findIndex((s) => s.walletAddress === walletAddress) + 1

        const newStats: GameStats = {
          score: currentScore,
          rank: playerRank,
          isHighScore: playerRank === 1,
          totalPlayers: updatedScores.length,
        }

        set({
          topScore: updatedScores[0]?.score ?? 0,
          lastGameStats: newStats,
          isProcessing: false,
          error: null,
        })

        return updatedScores
      }
      throw new Error('Invalid score data received')
    } catch (err) {
      const error: GameError = {
        code: 'SUBMIT_SCORE_ERROR',
        message: 'Failed to submit score',
        details: err,
      }
      set({ isProcessing: false, error })
      console.error('Error submitting score:', err)
      return null
    }
  },

  resetGame: () =>
    set({
      ...initialState,
    }),

  clearError: () =>
    set((state) => ({
      ...state,
      error: null,
    })),

  // New session management methods
  startGameSession: async (walletAddress: string) => {
    try {
      const response = await fetch('/.netlify/functions/postGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })

      if (!response.ok) throw new Error('Failed to start game session')

      const { sessionId } = await response.json()
      set({ currentSessionId: sessionId, sessionTokens: [] })
      return sessionId
    } catch (err) {
      set((state) => ({
        ...state,
        error: {
          code: 'SESSION_START_ERROR',
          message: 'Failed to start game session',
          details: err,
        },
      }))
      throw err
    }
  },

  updateSessionTokens: async (newToken: TokenEarned) => {
    const { currentSessionId, sessionTokens } = get()
    if (!currentSessionId) return

    const updatedTokens = [...sessionTokens, newToken]

    try {
      const response = await fetch('/.netlify/functions/updateGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          update: { tokensEarned: updatedTokens },
        }),
      })

      if (!response.ok) throw new Error('Failed to update session tokens')

      set({ sessionTokens: updatedTokens })
    } catch (err) {
      set((state) => ({
        ...state,
        error: {
          code: 'TOKEN_UPDATE_ERROR',
          message: 'Failed to update session tokens',
          details: err,
        },
      }))
    }
  },

  endGameSession: async () => {
    const { currentSessionId, score } = get()
    if (!currentSessionId) return

    try {
      const response = await fetch('/.netlify/functions/updateGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          update: {
            sessionEnd: new Date().toISOString(),
            score,
          },
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to end game session')
      }

      set({ currentSessionId: null, sessionTokens: [] })
    } catch (err) {
      set((state) => ({
        ...state,
        error: {
          code: 'SESSION_END_ERROR',
          message: 'Failed to end game session',
          details: err,
        },
      }))
      console.error('Error ending game session:', err)
    }
  },

  verifyTokensForMinting: async () => {
    const { currentSessionId, sessionTokens } = get()
    if (!currentSessionId) return false

    try {
      const response = await fetch(
        `/.netlify/functions/getGame?sessionId=${currentSessionId}`
      )
      if (!response.ok) throw new Error('Failed to verify tokens')

      const { tokensEarned } = await response.json()

      // Verify each token amount matches
      const verified = sessionTokens.every((clientToken) => {
        const serverToken = tokensEarned.find(
          (t) => t.symbol === clientToken.symbol
        )
        return serverToken && serverToken.amount === clientToken.amount
      })

      return verified
    } catch (err) {
      set((state) => ({
        ...state,
        error: {
          code: 'TOKEN_VERIFY_ERROR',
          message: 'Failed to verify tokens',
          details: err,
        },
      }))
      return false
    }
  },
}))

// Selector helpers
export const selectScore = (state: GameStore) => state.score
export const selectTopScore = (state: GameStore) => state.topScore
export const selectLastGameStats = (state: GameStore) => state.lastGameStats
export const selectError = (state: GameStore) => state.error
export const selectSessionTokens = (state: GameStore) => state.sessionTokens
