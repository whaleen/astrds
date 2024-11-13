// src/context/GameProvider.jsx
import React, { useReducer } from 'react'
import { GameContext } from './GameContext'

export const initialState = {
  gameState: 'INITIAL',
  score: 0,
  isProcessing: false,
  sound: {
    volume: 0.5,
    isMuted: false,
  },
  level: 1,
  levelProgress: 0,
  levelRequirement: 5, // Number of asteroids to destroy to advance level
  inventory: {
    ships: 3,
    tokens: 0,
    pills: 0,
  },
}

export const gameReducer = (state, action) => {
  console.log('GameReducer:', { currentState: state.gameState, action })

  switch (action.type) {
    case 'ADVANCE_LEVEL':
      return {
        ...state,
        level: state.level + 1,
        levelProgress: 0,
        levelRequirement: Math.floor(state.levelRequirement * 1.5), // Increase requirement each level
      }

    case 'UPDATE_LEVEL_PROGRESS':
      const newProgress = state.levelProgress + 1
      if (newProgress >= state.levelRequirement) {
        return {
          ...state,
          level: state.level + 1,
          levelProgress: 0,
          levelRequirement: Math.floor(state.levelRequirement * 1.5),
        }
      }
      return {
        ...state,
        levelProgress: newProgress,
      }

    case 'UPDATE_INVENTORY':
      return {
        ...state,
        inventory: {
          ...state.inventory,
          ...action.payload,
        },
      }

    case 'INSERT_QUARTER':
      return {
        ...state,
        isProcessing: true,
        gameState: 'READY_TO_PLAY',
      }

    case 'START_GAME':
      return {
        ...state,
        gameState: 'PLAYING',
        score: 0,
        isProcessing: false,
      }

    case 'GAME_OVER':
      return {
        ...state,
        gameState: 'GAME_OVER',
        isProcessing: false,
      }

    case 'RESET_GAME':
      return initialState

    case 'UPDATE_SCORE':
      return { ...state, score: action.payload }

    case 'TOGGLE_CHAT':
      return {
        ...state,
        chatMode: action.payload || (state.chatMode ? null : 'full'),
      }

    case 'UPDATE_SOUND':
      return {
        ...state,
        sound: { ...state.sound, ...action.payload },
      }

    case 'ADD_ITEM': {
      const { itemType, amount = 1 } = action.payload
      const maxLimits = {
        ships: 5,
        tokens: 99,
        pills: 99,
      }
      const currentAmount = state.inventory[itemType] || 0
      const newAmount = Math.min(
        currentAmount + amount,
        maxLimits[itemType] || 99
      )

      return {
        ...state,
        inventory: {
          ...state.inventory,
          [itemType]: newAmount,
        },
      }
    }

    case 'USE_ITEM': {
      const { itemType } = action.payload
      const currentAmount = state.inventory[itemType] || 0

      if (currentAmount <= 0) return state

      // Item-specific effects
      let newState = {
        ...state,
        inventory: {
          ...state.inventory,
          [itemType]: currentAmount - 1,
        },
      }

      switch (itemType) {
        case 'ships':
          if (state.gameState === 'PLAYING') {
            newState = {
              ...newState,
              inventory: {
                ...newState.inventory,
                ships: newState.inventory.ships + 1,
              },
            }
          }
          break

        case 'tokens':
          if (state.gameState === 'GAME_OVER') {
            newState = {
              ...newState,
              gameState: 'PLAYING',
            }
          }
          break
      }

      return newState
    }

    case 'RESET_INVENTORY':
      return {
        ...state,
        inventory: {
          ships: 3,
          tokens: 0,
          pills: 0,
        },
        powerups: {
          invincible: false,
          rapidFire: false,
        },
      }

    default:
      return state
  }
}

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const value = {
    state,
    dispatch,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
