// src/screens/game/components/LevelTransition.jsx
import React from 'react'
import { useLevelStore } from '@/stores/levelStore'

const LevelTransition = () => {
  const { level, isLevelTransition } = useLevelStore()

  if (!isLevelTransition) return null

  return (
    <div className='fixed inset-0 flex items-center justify-center z-30 pointer-events-none'>
      <h2
        className='text-4xl font-bold text-game-blue animate-[glow_1.5s_ease-in-out_infinite_alternate]
                     [text-shadow:0_0_10px_#4dc1f9,0_0_20px_#4dc1f9,0_0_30px_#4dc1f9]'
      >
        Level {level}
      </h2>
    </div>
  )
}

export default LevelTransition
