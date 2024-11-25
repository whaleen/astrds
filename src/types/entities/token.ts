// src/types/entities/token.ts
import { BaseEntity, Vector2D } from '../core'

export interface TokenConfig {
  screen: {
    width: number
    height: number
  }
  type?: string
}

export interface TokenState extends BaseEntity {
  type: string
  timeToLive: number
  creation: number
  color: string
  value: number // Add this line
}

export interface TokenMethods {
  destroy: () => void
  render: (state: GameScreenState) => void
}

export interface GameScreenState {
  context: CanvasRenderingContext2D
  screen: {
    width: number
    height: number
  }
}
