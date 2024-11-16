// src/screens/game/GameScreen.jsx
import React, { useEffect, useRef } from 'react'
import Ship from '../../game/entities/Ship'
import OverlayChat from '@/components/chat/OverlayChat'
import PauseOverlay from './components/PauseOverlay'
import { useOverlayStore } from '@/components/overlay/OverlayManager'
import { useGameStore } from '../../stores/gameStore'
import { useEngineStore } from '../../stores/engineStore'
import { useLevelStore } from '../../stores/levelStore'
import { useAudio } from '../../hooks/useAudio'
import { MUSIC_TRACKS } from '../../services/audio/AudioTypes'

const KEY = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32,
  P: 80,
  ESC: 27,
}

const GameScreen = () => {
  const canvasRef = useRef(null)
  const { activeOverlay } = useOverlayStore()

  // Game state selectors
  const isPaused = useGameStore((state) => state.isPaused)
  const togglePause = useGameStore((state) => state.togglePause)
  const setGameState = useGameStore((state) => state.setGameState)
  const { playMusic, stopMusic, transitionMusic, currentMusic } = useAudio()

  // Engine store selectors
  const {
    initializeEngine,
    startGameLoop,
    stopGameLoop,
    resetEngine,
    setKey,
    screen,
    addEntity,
  } = useEngineStore()

  // Initialize game
  useEffect(() => {
    let mounted = true
    console.log('GameScreen mount effect starting')

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Reset pause state at start of new game
    if (isPaused) {
      togglePause()
    }

    // Clear canvas
    context.clearRect(
      0,
      0,
      screen.width * screen.ratio,
      screen.height * screen.ratio
    )

    // Initialize engine with context
    initializeEngine(context)

    // Handle music transitions
    const startGameMusic = async () => {
      try {
        if (mounted) {
          if (currentMusic === MUSIC_TRACKS.TITLE) {
            await transitionMusic(MUSIC_TRACKS.TITLE, MUSIC_TRACKS.GAME, {
              crossFadeDuration: 1000,
            })
          } else if (currentMusic === MUSIC_TRACKS.GAME_OVER) {
            await transitionMusic(MUSIC_TRACKS.GAME_OVER, MUSIC_TRACKS.GAME, {
              crossFadeDuration: 1000,
            })
          } else {
            await playMusic(MUSIC_TRACKS.GAME, {
              fadeIn: true,
              loop: true,
            })
          }
        }
      } catch (error) {
        console.error('Error playing game music:', error)
      }
    }

    startGameMusic()

    // Create initial ship
    const ship = new Ship({
      position: {
        x: screen.width / 2,
        y: screen.height / 2,
      },
      create: addEntity,
      onDie: () => {
        useLevelStore.getState().resetLevel()
        setGameState('GAME_OVER')
        stopGameLoop()
      },
    })
    addEntity(ship, 'ship')

    // Generate initial asteroids
    useEngineStore.getState().spawnAsteroids(2)

    // Start game loop
    startGameLoop()

    return () => {
      mounted = false
      stopGameLoop()
      resetEngine()
      stopMusic(MUSIC_TRACKS.TITLE, { fadeOut: true })
    }
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't process game inputs if there's an active overlay
      if (activeOverlay) return

      // Handle pause only if no overlay is active
      if (e.keyCode === KEY.ESC || e.keyCode === KEY.P) {
        togglePause()
        if (isPaused) {
          startGameLoop()
        } else {
          stopGameLoop()
        }
        return
      }

      // Don't process other game inputs if paused
      if (isPaused) return

      switch (e.keyCode) {
        case KEY.LEFT:
        case KEY.A:
          setKey('left', 1)
          break
        case KEY.RIGHT:
        case KEY.D:
          setKey('right', 1)
          break
        case KEY.UP:
        case KEY.W:
          setKey('up', 1)
          break
        case KEY.SPACE:
          setKey('space', 1)
          break
      }
    }

    const handleKeyUp = (e) => {
      // Always process key up events to prevent stuck keys
      switch (e.keyCode) {
        case KEY.LEFT:
        case KEY.A:
          setKey('left', 0)
          break
        case KEY.RIGHT:
        case KEY.D:
          setKey('right', 0)
          break
        case KEY.UP:
        case KEY.W:
          setKey('up', 0)
          break
        case KEY.SPACE:
          setKey('space', 0)
          break
      }
    }

    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    isPaused,
    activeOverlay,
    togglePause,
    startGameLoop,
    stopGameLoop,
    setKey,
  ])

  return (
    <>
      <canvas
        ref={canvasRef}
        width={screen.width * screen.ratio}
        height={screen.height * screen.ratio}
        className='block bg-black absolute inset-0 w-full h-full'
      />
      <OverlayChat />
      <PauseOverlay />
    </>
  )
}

export default GameScreen
