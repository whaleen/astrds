// src/screens/game/GameScreen.tsx
import React, { useEffect, useRef } from 'react'
import { useStateMachine, selectIsPaused } from '@/stores/stateMachine'
import { useEngineStore } from '@/stores/engineStore'
import Ship from '@/game/entities/Ship'
// import OverlayChat from '@/components/chat/OverlayChat'
import PauseOverlay from './components/PauseOverlay'
import DeathDisplay from './components/DeathDisplay'
import { MachineState } from '@/types/machine'
import { GameScreenProps } from '@/types/components/layout'

const GameScreen: React.FC<GameScreenProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mountedRef = useRef(false)

  // Game state management
  const setState = useStateMachine((state) => state.setState)
  const isPaused = useStateMachine(selectIsPaused)
  const setPause = useStateMachine((state) => state.setPause)

  // Engine state management
  const {
    initializeEngine,
    startGameLoop,
    stopGameLoop,
    resetEngine,
    setKey,
    addEntity,
    screen,
  } = useEngineStore()

  // Handle pause
  useEffect(() => {
    if (isPaused) {
      stopGameLoop()
    } else if (mountedRef.current) {
      startGameLoop()
    }
  }, [isPaused, stopGameLoop, startGameLoop])

  // Game initialization
  useEffect(() => {
    if (mountedRef.current) return
    console.log('Initializing game screen...')

    const initGame = async () => {
      await new Promise(resolve => requestAnimationFrame(resolve))

      if (!canvasRef.current) {
        console.error('Canvas ref not available')
        return
      }

      const context = canvasRef.current.getContext('2d')
      if (!context) {
        console.error('Could not get canvas context')
        return
      }
      console.log('Setting up game engine...')

      try {
        // Reset and initialize engine
        resetEngine()
        initializeEngine(context)

        // Create ship
        console.log('Creating ship...')
        const ship = new Ship({
          position: {
            x: screen.width / 2,
            y: screen.height / 2,
          },
          onDie: () => {
            console.log('Ship destroyed')
            setState(MachineState.GAME_OVER)

            // is this a good place to set the sessionEnd in the new blob?
            stopGameLoop()
          },
        })
        addEntity(ship, 'ship')

        // Spawn initial asteroids
        console.log('Spawning initial asteroids...')
        const engineStore = useEngineStore.getState()
        engineStore.spawnAsteroids(2)

        // Start game loop if not paused
        if (!isPaused) {
          console.log('Starting game loop...')
          startGameLoop()
        }
        mountedRef.current = true
      } catch (error) {
        console.error('Game initialization error:', error)
      }
    }

    initGame()

    // Cleanup
    return () => {
      console.log('Cleaning up game screen...')
      mountedRef.current = false
      stopGameLoop()
      resetEngine()
    }
  }, [])

  // Keyboard controls with pause handling
  useEffect(() => {
    console.log('Setting up keyboard controls...')

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle pause key
      if (e.code === 'Escape') {
        setPause(!isPaused)
        return
      }

      // Don't process other controls if paused
      if (isPaused) return

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          setKey('left', 1)
          break
        case 'ArrowRight':
        case 'KeyD':
          setKey('right', 1)
          break
        case 'ArrowUp':
        case 'KeyW':
          setKey('up', 1)
          break
        case 'Space':
          setKey('space', 1)
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isPaused) return

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          setKey('left', 0)
          break
        case 'ArrowRight':
        case 'KeyD':
          setKey('right', 0)
          break
        case 'ArrowUp':
        case 'KeyW':
          setKey('up', 0)
          break
        case 'Space':
          setKey('space', 0)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setKey, isPaused, setPause])

  return (
    <>
      <canvas
        ref={canvasRef}
        width={screen.width * screen.ratio}
        height={screen.height * screen.ratio}
        className={`block bg-black absolute inset-0 w-full h-full ${className || ''}`}
      />
      {/* <OverlayChat /> */}
      {isPaused && <PauseOverlay />}
      <DeathDisplay />
    </>
  )
}

export default GameScreen
