// src/components/game/GameControls.jsx
import React from 'react'
import { useGame } from '../../hooks/useGame'

const GameControls = () => {
  const { actions } = useGame()

  return (
    <div className='absolute top-5 left-1/2 -translate-x-1/2 z-10 flex gap-4'>
      <div className='text-xs text-center leading-7 text-neutral-400'>
        Use [A][S][W][D] or [←][↑][↓][→] to MOVE
        <br />
        Use [SPACE] to SHOOT
      </div>
    </div>
  )
}

export default GameControls
