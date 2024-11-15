// src/components/layout/GameLayout.jsx
import React from 'react'
import Header from '@/components/common/Header'
import InventoryHUD from './InventoryHUD'
import { useGameStore } from '@/stores/gameStore'

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
        </>
      )}
    </div>
  )
}

export default GameLayout
