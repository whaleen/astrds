// src/screens/game/components/GameStateManager.jsx
import React from 'react'
import { useGameStore } from '@/stores/gameStore'
import TitleScreen from '@/screens/title/TitleScreen'
import ReadyScreen from '@/screens/ready/ReadyScreen'
import GameScreen from '../GameScreen'
import GameOverScreen from '@/screens/gameover/GameOverScreen'
import LeaderboardScreen from '@/screens/leaderboard/LeaderboardScreen'

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
