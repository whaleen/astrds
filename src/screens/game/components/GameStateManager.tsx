// src/screens/game/components/GameStateManager.tsx
import React, { useEffect } from 'react'
import { useStateMachine, selectMachineState } from '@/stores/stateMachine'
import { useEngineStore } from '@/stores/engineStore'
import TitleScreen from '@/screens/title/TitleScreen'
import ReadyScreen from '@/screens/ready/ReadyScreen'
import GameScreen from '@/screens/game/GameScreen'
import GameOverScreen from '@/screens/gameover/GameOverScreen'
import { MachineState } from '@/types/machine'

const GameStateManager: React.FC = () => {
  const currentState = useStateMachine(selectMachineState)
  const resetState = useStateMachine(state => state.resetState)
  const isTransitioning = useStateMachine((state) => state.isTransitioning)
  const stopGameLoop = useEngineStore((state) => state.stopGameLoop)

  // Ensure game loop is stopped when returning to initial state
  useEffect(() => {
    if (currentState === MachineState.INITIAL) {
      console.log('Stopping game loop due to INITIAL state')
      stopGameLoop()
      resetState()
    }
  }, [currentState, stopGameLoop, resetState])

  // Optional loading state during transitions
  if (isTransitioning) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-game-blue text-xl">Loading...</div>
      </div>
    )
  }

  // Render appropriate screen based on game state
  switch (currentState) {
    case MachineState.INITIAL:
      return <TitleScreen />
    case MachineState.READY_TO_PLAY:
      return <ReadyScreen />
    case MachineState.PLAYING:
    case MachineState.PAUSED:
      return <GameScreen />
    case MachineState.GAME_OVER:
      return <GameOverScreen />
    default:
      return null
  }
}

export default GameStateManager
