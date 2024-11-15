// src/screens/game/components/LevelTransition.jsx
import React from 'react'
import { useLevelStore } from '@/stores/levelStore'

const LevelTransition = () => {
  const { level, isLevelTransition } = useLevelStore()

  if (!isLevelTransition) return null

  return (
    <div className='fixed inset-0 flex items-center justify-center z-30 pointer-events-none'>
      <div className='text-game-blue text-6xl font-bold animate-fadeInOut'>
        Level {level}
      </div>
    </div>
  )
}

export default LevelTransition
