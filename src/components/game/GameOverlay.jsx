// src/components/game/GameOverlay.jsx
import React from 'react'
import { useGame } from '../../hooks/useGame'

const GameOverlay = () => {
  const { state } = useGame()

  return (
    <div className='fixed top-5 left-5 z-10 flex flex-col gap-2 text-sm md:text-base'>
      <div>Score: {state.score}</div>
      <div>Top Score: {localStorage.getItem('topscore') || 0}</div>
    </div>
  )
}

export default GameOverlay
