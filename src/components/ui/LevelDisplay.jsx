import React from 'react'
import { useLevelStore } from '../../stores/levelStore'

const LevelDisplay = () => {
  const level = useLevelStore((state) => state.level)

  return (
    <div className='fixed top-5 left-1/2 -translate-x-1/2 z-10 bg-black/50 px-4 py-2 border border-game-blue'>
      <div className='flex flex-col items-center gap-1'>
        <span className='text-xs text-game-blue'>LEVEL</span>
        <span className='text-2xl font-bold text-white'>{level}</span>
      </div>
    </div>
  )
}

export default LevelDisplay
