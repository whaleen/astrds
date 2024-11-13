// src/components/layout/GameLayout.jsx
import React from 'react'
import Header from './Header'
import InventoryHUDTest from '../ui/InventoryHUDtest'
import { useGame } from '../../hooks/useGame'
import PowerupTest from '../test/PowerupTest'

const GameLayout = ({ children }) => {
  const { state } = useGame()

  return (
    <div className='min-h-screen bg-black relative'>
      <Header />
      <main className='flex items-center justify-center min-h-screen'>
        {children}
      </main>
      {state.gameState === 'PLAYING' && (
        <>
          <InventoryHUDTest />
          <PowerupTest /> {/* Add this */}
        </>
      )}
    </div>
  )
}

export default GameLayout
