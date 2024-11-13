// src/hooks/useGame.js
import { useGameContext } from '../context/GameContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { soundManager } from '../sounds/SoundManager'

export const useGame = () => {
  const { state, dispatch } = useGameContext()
  const wallet = useWallet()

  const actions = {
    insertQuarter: () => dispatch({ type: 'INSERT_QUARTER' }),
    startGame: () => dispatch({ type: 'START_GAME' }),
    endGame: () => dispatch({ type: 'GAME_OVER' }),
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
    updateScore: (score) => dispatch({ type: 'UPDATE_SCORE', payload: score }),
    updateSound: (settings) => dispatch({ type: 'UPDATE_SOUND', payload: settings }),
    togglePause: () => dispatch({ type: 'TOGGLE_PAUSE' }),
    addItem: (itemType, amount = 1) => {
      dispatch({
        type: 'ADD_ITEM',
        payload: { itemType, amount }
      })
      soundManager.playSound('collect')
    },
    useItem: (itemType) => {
      dispatch({
        type: 'USE_ITEM',
        payload: { itemType }
      })
      return true
    },
    resetInventory: () => {
      dispatch({ type: 'RESET_INVENTORY' })
    },
  }

  return { state, actions }
}
