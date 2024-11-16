// src/screens/game/components/DeathScreen.jsx
import React from 'react'
import { useInventoryStore } from '@/stores/inventoryStore'
import { ShipIcon } from '@/components/icons/GameIcons'
import { useEngineStore } from '@/stores/engineStore'

const DeathScreen = () => {
  const ships = useInventoryStore((state) => state.items.ships)

  // Access the current ship from engine store to check invulnerability
  const currentShip = useEngineStore((state) => state.entities.ship[0])

  // Only show when ship is respawning with invulnerability and we have lives left
  if (!currentShip?.isInvulnerable || ships <= 0) return null

  return (
    <div className='fixed top-5 left-1/2 -translate-x-1/2 z-10'>
      <div className='bg-black/50 px-6 py-4 border border-game-red animate-fadeIn'>
        <div className='flex flex-col items-center gap-3'>
          <div className='relative'>
            <ShipIcon
              size={48}
              className='text-game-red opacity-50 animate-[spin_2s_linear_infinite]'
            />
          </div>

          <div className='text-xl text-game-red font-bold animate-pulse'>
            Ship Destroyed!
          </div>

          <div className='text-sm text-game-green'>
            {ships} {ships === 1 ? 'Life' : 'Lives'} Remaining
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeathScreen
