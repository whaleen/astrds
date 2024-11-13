// src/components/game/GameStateManager.jsx
import React from 'react'
import { useGameStore } from '../../stores/gameStore'
import TitleScreen from '../screens/TitleScreen'
import ReadyScreen from '../screens/ReadyScreen'
import GameScreen from './GameScreen'
import GameOverScreen from '../screens/GameOverScreen'
import LeaderboardScreen from '../screens/LeaderboardScreen'

const GameStateManager = () => {
  const gameState = useGameStore((state) => state.gameState)

  switch (gameState) {
    case 'INITIAL':
      return <TitleScreen />
    case 'READY_TO_PLAY':
      return <ReadyScreen />
    case 'PLAYING':
      return <GameScreen />
    case 'GAME_OVER':
      return <GameOverScreen />
    case 'LEADERBOARD':
      return <LeaderboardScreen />
    default:
      return null
  }
}

export default GameStateManager
