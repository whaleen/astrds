// src/components/game/GameStateManager.jsx
import React from 'react'
import { useGame } from '../../hooks/useGame'
import TitleScreen from '../screens/TitleScreen'
import ReadyScreen from '../screens/ReadyScreen'
import GameScreen from './GameScreen'
import LeaderboardScreen from '../screens/LeaderboardScreen'

const GameStateManager = () => {
  const { state } = useGame()
  console.log('GameStateManager - current state:', state.gameState)

  switch (state.gameState) {
    case 'INITIAL':
      return <TitleScreen />
    case 'READY_TO_PLAY':
      return <ReadyScreen />
    case 'PLAYING':
      return <GameScreen />
    case 'GAME_OVER':
      return <LeaderboardScreen />
    default:
      return null
  }
}

export default GameStateManager
