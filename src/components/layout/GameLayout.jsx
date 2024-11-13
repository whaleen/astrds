// src/components/layout/GameLayout.jsx
import React from 'react'
import Header from './Header'
import InventoryHUD from '../ui/InventoryHUD'
import { useGameStore } from '../../stores/gameStore'
// For testing purposes:
// import PowerupTest from '../test/PowerupTest'

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
          <InventoryHUD />
          {/* <PowerupTest /> */}
        </>
      )}
    </div>
  )
}

export default GameLayout
