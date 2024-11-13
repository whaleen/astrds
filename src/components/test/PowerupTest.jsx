// src/components/test/PowerupTest.jsx
import React from 'react'
import { usePowerupStore } from '../../stores/powerupStore'

const PowerupTest = () => {
  const powerups = usePowerupStore((state) => state.powerups)
  const activatePowerups = usePowerupStore((state) => state.activatePowerups)
  const deactivatePowerups = usePowerupStore(
    (state) => state.deactivatePowerups
  )

  return (
    <div className='fixed bottom-5 left-5 p-4 bg-black/50 border border-game-blue z-50'>
      <h3 className='text-game-blue mb-4'>Powerup Test Panel</h3>

      {/* Status Display */}
      <div className='mb-4 space-y-2'>
        <div>
          Invincible:
          <span
            className={powerups.invincible ? 'text-green-400' : 'text-red-400'}
          >
            {powerups.invincible ? ' ON' : ' OFF'}
          </span>
        </div>
        <div>
          Rapid Fire:
          <span
            className={powerups.rapidFire ? 'text-green-400' : 'text-red-400'}
          >
            {powerups.rapidFire ? ' ON' : ' OFF'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className='space-x-2'>
        <button
          onClick={() => {
            activatePowerups()
            // Auto-deactivate after 10 seconds
            setTimeout(deactivatePowerups, 10000)
          }}
          className='px-4 py-2 bg-game-blue/20 text-game-blue hover:bg-game-blue/30'
        >
          Activate (10s)
        </button>

        <button
          onClick={deactivatePowerups}
          className='px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30'
        >
          Deactivate
        </button>
      </div>
    </div>
  )
}

export default PowerupTest
