// src/components/game/PauseOverlay.jsx
import React from 'react'
import { useGameStore } from '../../stores/gameStore'

const PauseOverlay = () => {
  // Only get isPaused from the store - don't get togglePause here
  const isPaused = useGameStore((state) => state.isPaused)

  // Don't add pause toggle logic here - it's already handled in GameScreen
  if (!isPaused) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm'>
      <div className='text-center space-y-8'>
        <h2
          className='text-4xl font-bold text-game-blue animate-[glow_1.5s_ease-in-out_infinite_alternate]
                     [text-shadow:0_0_10px_#4dc1f9,0_0_20px_#4dc1f9,0_0_30px_#4dc1f9]'
        >
          PAUSED
        </h2>

        <div className='space-y-2 text-white/80'>
          <p>Press [ESC] or [P] to resume</p>
          <p>Press [C] to toggle chat</p>
        </div>
      </div>
    </div>
  )
}

export default PauseOverlay
