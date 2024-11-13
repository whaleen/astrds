// src/components/layout/GameLayout.jsx
import React from 'react'
import Header from './Header'
import InventoryHUDTest from '../ui/InventoryHUDtest'
// import PowerupTest from '../test/PowerupTest'
import { useGameStore } from '../../stores/gameStore'

const GameLayout = ({ children }) => {
  const gameState = useGameStore((state) => state.gameState)

  return (
    <div className='min-h-screen bg-black relative'>
      <Header />
      <main className='flex items-center justify-center min-h-screen'>
        {children}
      </main>
      {gameState === 'PLAYING' && (
        <>
          <InventoryHUDTest />
          {/* <PowerupTest /> */}
        </>
      )}
    </div>
  )
}

export default GameLayout
