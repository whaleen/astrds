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
  sessionState: {
    status: null,
  },
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
    console.log('Starting game session for wallet:', walletAddress)

    try {
      const response = await fetch('/.netlify/functions/postGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })

      if (!response.ok) {
        throw new Error('Failed to start game session')
      }

      const { sessionId } = await response.json()
      console.log('Game session started successfully. Session ID:', sessionId)

      set({
        currentSessionId: sessionId,
        sessionTokens: [],
        sessionState: { status: 'active' },
      })

      return sessionId
    } catch (err) {
      console.error('Error starting game session:', err)
      set((state) => ({
        ...state,
        error: {
          code: 'SESSION_START_ERROR',
          message: 'Failed to start game session',
          details: err,
        },
        sessionState: { status: null },
      }))
      throw err
    }
  },

  updateSessionTokens: async (newToken: TokenEarned) => {
    const { currentSessionId, sessionTokens } = get()
    if (!currentSessionId) {
      console.warn('No active session for token update')
      return
    }

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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update session tokens')
      }

      // Only update local state after successful server update
      set({ sessionTokens: updatedTokens })
    } catch (err) {
      console.error('Failed to update session tokens:', err)
      set((state) => ({
        error: {
          code: 'TOKEN_UPDATE_ERROR',
          message: 'Failed to update session tokens',
          details: err,
        },
      }))
      throw err
    }
  },

  endGameSession: async () => {
    const { currentSessionId, sessionState, score } = get()

    // Guard against multiple calls
    if (
      !currentSessionId ||
      sessionState.status === 'ending' ||
      sessionState.status === 'ended'
    ) {
      console.log('Session already ending or ended')
      return
    }

    try {
      // Mark session as ending
      set({ sessionState: { status: 'ending' } })

      // Wait for any pending token updates
      await new Promise((resolve) => setTimeout(resolve, 100))

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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to end game session')
      }

      set({
        currentSessionId: null,
        sessionTokens: [],
        sessionState: {
          status: 'ended',
          endTime: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.error('Error ending game session:', err)
      set((state) => ({
        error: {
          code: 'SESSION_END_ERROR',
          message:
            err instanceof Error ? err.message : 'Failed to end game session',
          details: err,
        },
        sessionState: { status: 'active' },
      }))
    }
  },

  verifyTokensForMinting: async () => {
    const { currentSessionId, sessionTokens } = get()
    if (!currentSessionId) return 0 // Return 0 instead of false

    try {
      const response = await fetch(
        `/.netlify/functions/getGame?sessionId=${currentSessionId}`
      )
      if (!response.ok) throw new Error('Failed to verify tokens')

      const { tokensEarned } = await response.json()

      // Calculate and return the total token count instead of boolean
      const serverCount = tokensEarned.reduce(
        (sum, token) => sum + (token.symbol === 'ASTRDS' ? token.amount : 0),
        0
      )

      return serverCount
    } catch (err) {
      set((state) => ({
        ...state,
        error: {
          code: 'TOKEN_VERIFY_ERROR',
          message: 'Failed to verify tokens',
          details: err,
        },
      }))
      return 0 // Return 0 on error
    }
  },
}))

// Selector helpers
export const selectScore = (state: GameStore) => state.score
export const selectTopScore = (state: GameStore) => state.topScore
export const selectLastGameStats = (state: GameStore) => state.lastGameStats
export const selectError = (state: GameStore) => state.error
export const selectSessionTokens = (state: GameStore) => state.sessionTokens
