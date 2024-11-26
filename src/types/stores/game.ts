// src/types/stores/game.ts
import { Score } from '../core' // Add this import at the top

export interface GameSessionState {
  status: 'active' | 'ending' | 'ended' | null
  endTime?: string
}

export interface GameError {
  code: string
  message: string
  details?: unknown
}

export interface GameStats {
  score: number
  rank: number
  isHighScore: boolean
  totalPlayers: number
}

export interface TokenEarned {
  symbol: string
  amount: number
  verified: boolean
}

export interface GameSession {
  id: string
  walletAddress: string
  score: number
  tokensEarned: TokenEarned[]
  levelReached: number
  sessionStart: string
  sessionEnd?: string
  lastUpdated: string
}

export interface GameStoreState {
  isProcessing: boolean
  score: number
  topScore: number
  lastGameStats: GameStats | null
  error: GameError | null
  currentSessionId: string | null
  sessionTokens: TokenEarned[]
  sessionState: GameSessionState
}

export interface GameStore extends GameStoreState {
  updateScore: (score: number) => void
  addToScore: (points: number) => void
  submitFinalScore: (walletAddress: string) => Promise<Score[] | null>
  resetGame: () => void
  clearError: () => void
  startGameSession: (walletAddress: string) => Promise<string>
  updateSessionTokens: (newToken: TokenEarned) => Promise<void>
  endGameSession: () => Promise<void>
  verifyTokensForMinting: () => Promise<number> // Change return type from boolean to number
}
