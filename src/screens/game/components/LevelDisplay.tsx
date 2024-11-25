// src/screens/game/components/LevelDisplay.tsx

import React from 'react'
import { useLevelStore } from '@/stores/levelStore'
import { LevelDisplayProps } from '@/types/components/game'

const LevelDisplay: React.FC<LevelDisplayProps> = ({ className }) => {
  const { level, isRespawning } = useLevelStore()

  // Don't show during respawn state
  if (isRespawning) return null

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-10 
                  bg-black/50 px-4 py-2 border border-game-blue ${className}`}
    >
      <div className='flex flex-col items-center gap-1'>
        <span className='text-xs text-game-blue'>LEVEL</span>
        <span className='text-2xl font-bold text-white'>{level}</span>
      </div>
    </div>
  )
}

export default LevelDisplay
