// src/context/GameContext.jsx
import React, { createContext, useContext } from 'react'

export const GameContext = createContext()

export const useGameContext = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}
