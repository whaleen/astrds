// src/components/game/GameScreen.jsx
import React, { useEffect, useRef } from 'react'
import Ship from '../../game/entities/Ship'
import Pill from '../../game/entities/Pill'
import Asteroid from '../../game/entities/Asteroid'
import Bullet from '../../game/entities/Bullet'
import { randomNumBetweenExcluding } from '../../helpers/helpers'
import { soundManager } from '../../sounds/SoundManager'
import OverlayChat from '../chat/OverlayChat'
import { usePowerupStore } from '../../stores/powerupStore'
import ShipPickup from '../../game/entities/ShipPickup'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useLevelStore } from '../../stores/levelStore'
import PauseOverlay from './PauseOverlay'
import { useChatStore } from '../../stores/chatStore'
import { useGameStore } from '../../stores/gameStore'

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
  const { toggleOverlay: toggleOverlayChat } = useChatStore()

  // Game state selectors
  const score = useGameStore((state) => state.score)
  const addToScore = useGameStore((state) => state.addToScore)
  const submitFinalScore = useGameStore((state) => state.submitFinalScore)
  const setGameState = useGameStore((state) => state.setGameState)
  const isPaused = useGameStore((state) => state.isPaused)
  const togglePause = useGameStore((state) => state.togglePause)

  // Powerup selectors
  const powerups = usePowerupStore((state) => state.powerups)
  const activatePowerups = usePowerupStore((state) => state.activatePowerups)
  const deactivatePowerups = usePowerupStore(
    (state) => state.deactivatePowerups
  )

  // Game refs
  const canvasRef = useRef(null)
  const gameStateRef = useRef({
    context: null,
    ship: [],
    asteroids: [],
    bullets: [],
    particles: [],
    pills: [],
    lastPillSpawn: 0,
    pillSpawnDelay: 3000,
    keys: {
      left: 0,
      right: 0,
      up: 0,
      space: 0,
    },
    inGame: false,
    screen: {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.devicePixelRatio || 1,
    },
    asteroidCount: 2,
    shipPickups: [],
    lastShipPickupSpawn: 0,
    shipPickupInterval: 20000,
    lastShot: 0,
  })

  const requestRef = useRef()

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
    }
  }, [])

  const spawnShipPickup = () => {
    if (gameStateRef.current.shipPickups.length === 0) {
      const pickup = new ShipPickup({
        screen: gameStateRef.current.screen,
      })
      createObject(pickup, 'shipPickups')
    }
  }

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.__gameScreen = {
        spawnShipPickup,
      }
    }

    return () => {
      if (canvasRef.current) {
        delete canvasRef.current.__gameScreen
      }
    }
  }, [])

  const createObject = (item, group) => {
    gameStateRef.current[group].push(item)
  }

  const updateObjects = (items, group) => {
    let index = 0
    for (let item of items) {
      if (item.delete) {
        gameStateRef.current[group].splice(index, 1)
      } else {
        items[index].render(gameStateRef.current)
      }
      index++
    }
  }

  const checkCollisionsWith = (items1, items2) => {
    for (let i = items1.length - 1; i >= 0; i--) {
      for (let j = items2.length - 1; j >= 0; j--) {
        const item1 = items1[i]
        const item2 = items2[j]
        if (checkCollision(item1, item2)) {
          item1.destroy()
          item2.destroy()
        }
      }
    }
  }

  const checkCollision = (obj1, obj2) => {
    const vx = obj1.position.x - obj2.position.x
    const vy = obj1.position.y - obj2.position.y
    const length = Math.sqrt(vx * vx + vy * vy)
    return length < obj1.radius + obj2.radius
  }

  const generateAsteroids = (howMany) => {
    const ship = gameStateRef.current.ship[0]
    const screen = gameStateRef.current.screen

    for (let i = 0; i < howMany; i++) {
      const asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(
            0,
            screen.width,
            ship.position.x - 60,
            ship.position.x + 60
          ),
          y: randomNumBetweenExcluding(
            0,
            screen.height,
            ship.position.y - 60,
            ship.position.y + 60
          ),
        },
        create: createObject,
        currentScore: score,
      })
      createObject(asteroid, 'asteroids')
    }
  }

  const addInventoryItem = useInventoryStore((state) => state.addItem)

  const update = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }

    const gameState = gameStateRef.current
    const currentlyPaused = isPaused

    requestRef.current = requestAnimationFrame(update)

    if (!gameState.context || !gameState.inGame || currentlyPaused) {
      return
    }

    const context = gameState.context
    context.save()
    context.scale(gameState.screen.ratio, gameState.screen.ratio)

    // Motion trail
    context.fillStyle = '#000'
    context.globalAlpha = 0.4
    context.fillRect(0, 0, gameState.screen.width, gameState.screen.height)
    context.globalAlpha = 1

    // Check spawning timers
    const now = Date.now()
    if (now - gameState.lastPillSpawn > gameState.pillSpawnDelay) {
      const newPill = new Pill({ screen: gameState.screen, type: 'standard' })
      createObject(newPill, 'pills')
      gameState.lastPillSpawn = now
    }

    if (now - gameState.lastShipPickupSpawn >= gameState.shipPickupInterval) {
      spawnShipPickup()
      gameState.lastShipPickupSpawn = now
    }

    // Update all game objects
    updateObjects(gameState.particles, 'particles')
    updateObjects(gameState.asteroids, 'asteroids')
    updateObjects(gameState.bullets, 'bullets')
    updateObjects(gameState.pills, 'pills')
    updateObjects(gameState.ship, 'ship')
    updateObjects(gameState.shipPickups, 'shipPickups')

    // Check for collisions
    checkCollisionsWith(gameState.bullets, gameState.asteroids)
    checkCollisionsWith(gameState.ship, gameState.asteroids)

    // Check for collectible collisions
    if (gameState.ship[0]) {
      // Check pill collisions
      gameState.pills.forEach((pill) => {
        if (checkCollision(gameState.ship[0], pill)) {
          pill.destroy()
          addInventoryItem('pills', 1)
          soundManager.playSound('collect')
          activatePowerups()
          setTimeout(deactivatePowerups, 10000)
        }
      })

      // Check ship pickup collisions
      gameState.shipPickups.forEach((pickup) => {
        if (checkCollision(gameState.ship[0], pickup)) {
          pickup.destroy()
          addInventoryItem('ships', 1)
          soundManager.playSound('collect')
        }
      })
    }

    // Next level check
    if (!gameState.asteroids.length) {
      gameState.asteroidCount = Math.min(gameState.asteroidCount + 1, 10)
      useLevelStore.getState().incrementLevel()
      generateAsteroids(gameState.asteroidCount)
    }

    // Handle shooting
    if (
      gameState.keys.space &&
      Date.now() - gameState.lastShot > (powerups.rapidFire ? 50 : 250)
    ) {
      const bullet = new Bullet({
        ship: gameState.ship[0],
        powered: powerups.rapidFire,
      })
      createObject(bullet, 'bullets')
      gameState.lastShot = Date.now()
    }

    context.restore()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Reset pause state at start of new game
    if (isPaused) {
      togglePause()
    }

    context.clearRect(
      0,
      0,
      gameStateRef.current.screen.width * gameStateRef.current.screen.ratio,
      gameStateRef.current.screen.height * gameStateRef.current.screen.ratio
    )

    gameStateRef.current.context = context
    gameStateRef.current.inGame = true

    soundManager.playMusic('gameMusic', {
      fadeIn: true,
      loop: true,
    })

    const ship = new Ship({
      position: {
        x: gameStateRef.current.screen.width / 2,
        y: gameStateRef.current.screen.height / 2,
      },
      create: createObject,
      onDie: () => {
        if (gameStateRef.current.inGame) {
          soundManager.transitionMusic('gameMusic', 'gameOverMusic', {
            crossFadeDuration: 1000,
          })
          gameStateRef.current.inGame = false
          useLevelStore.getState().resetLevel()
          setGameState('GAME_OVER')
        }
      },
    })
    createObject(ship, 'ship')

    generateAsteroids(gameStateRef.current.asteroidCount)

    gameStateRef.current.lastPillSpawn = Date.now()
    gameStateRef.current.lastShipPickupSpawn = Date.now()

    context.save()
    context.scale(
      gameStateRef.current.screen.ratio,
      gameStateRef.current.screen.ratio
    )
    context.fillStyle = '#000'
    context.fillRect(
      0,
      0,
      gameStateRef.current.screen.width,
      gameStateRef.current.screen.height
    )
    context.restore()

    requestRef.current = requestAnimationFrame(update)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      gameStateRef.current.inGame = false
      if (soundManager.currentMusic) {
        soundManager.stopMusic('gameMusic', { fadeOut: true })
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStateRef.current.inGame) return

      // Handle pause before other inputs
      if (e.keyCode === KEY.ESC || e.keyCode === KEY.P) {
        togglePause()
        soundManager.playSound(!isPaused ? 'ready' : 'collect')
        return
      }

      // Don't process game inputs if paused
      if (isPaused) return

      if (e.keyCode === KEY.LEFT || e.keyCode === KEY.A)
        gameStateRef.current.keys.left = 1
      if (e.keyCode === KEY.RIGHT || e.keyCode === KEY.D)
        gameStateRef.current.keys.right = 1
      if (e.keyCode === KEY.UP || e.keyCode === KEY.W)
        gameStateRef.current.keys.up = 1
      if (e.keyCode === KEY.SPACE) gameStateRef.current.keys.space = 1
      if (e.key.toLowerCase() === 'c') {
        toggleOverlayChat()
      }
    }

    const handleKeyUp = (e) => {
      if (e.keyCode === KEY.LEFT || e.keyCode === KEY.A)
        gameStateRef.current.keys.left = 0
      if (e.keyCode === KEY.RIGHT || e.keyCode === KEY.D)
        gameStateRef.current.keys.right = 0
      if (e.keyCode === KEY.UP || e.keyCode === KEY.W)
        gameStateRef.current.keys.up = 0
      if (e.keyCode === KEY.SPACE) gameStateRef.current.keys.space = 0
    }

    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [togglePause, isPaused])

  return (
    <>
      <canvas
        ref={canvasRef}
        width={
          gameStateRef.current.screen.width * gameStateRef.current.screen.ratio
        }
        height={
          gameStateRef.current.screen.height * gameStateRef.current.screen.ratio
        }
        className='block bg-black absolute inset-0 w-full h-full'
      />
      <OverlayChat />
      <PauseOverlay />
    </>
  )
}

export default GameScreen
