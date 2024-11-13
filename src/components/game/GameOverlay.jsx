// src/components/game/GameOverlay.jsx
import React from 'react'
import { useGameStore } from '../../stores/gameStore'

const GameOverlay = () => {
  const score = useGameStore((state) => state.score)
  const topScore = useGameStore((state) => state.topScore)

  return (
    <div className='fixed top-5 left-5 z-10 flex flex-col gap-2 text-sm md:text-base'>
      <div>Score: {score}</div>
      <div>Top Score: {topScore}</div>
    </div>
  )
}

export default GameOverlay
