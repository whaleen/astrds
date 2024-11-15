// src/screens/game/components/PauseOverlay.jsx
import React from 'react'
import { useGameStore } from '@/stores/gameStore'

const PauseOverlay = () => {
  const isPaused = useGameStore((state) => state.isPaused)

  if (!isPaused) return null

  const shortcuts = [
    { key: '[ESC] or [P]', action: 'Pause Game' },
    { key: '[WASD] or [←↑↓→]', action: 'Move Ship' },
    { key: '[SPACE]', action: 'Fire Weapons' },
    { key: '[C]', action: 'Toggle Chat' },
    { key: '[M]', action: 'Toggle Music' },
    { key: '[1-5]', action: 'Adjust Volume' },
  ]

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center '>
      {/* <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm'> 
    APply blur and opacity to the background */}
      <div className='text-center space-y-8 max-w-lg w-full mx-4'>
        <h2
          className='text-4xl font-bold text-game-blue animate-[glow_1.5s_ease-in-out_infinite_alternate]
                     [text-shadow:0_0_10px_#4dc1f9,0_0_20px_#4dc1f9,0_0_30px_#4dc1f9]'
        >
          PAUSED
        </h2>

        <div className='bg-black/50 border border-white/10 rounded-lg p-6'>
          <h3 className='text-lg text-game-blue mb-4'>Keyboard Controls</h3>
          <div className='space-y-2'>
            {shortcuts.map(({ key, action }) => (
              <div
                key={key}
                className='flex justify-between items-center text-sm'
              >
                <span className='text-white/80'>{action}</span>
                <span className='text-game-blue font-mono'>{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PauseOverlay
