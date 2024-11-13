import React, { useEffect, useRef } from 'react'
import { useGame } from '../../hooks/useGame'
import { useWallet } from '@solana/wallet-adapter-react'
import Ship from '../../game/entities/Ship'
import Pill from '../../game/entities/Pill'
import Asteroid from '../../game/entities/Asteroid'
import Bullet from '../../game/entities/Bullet'
import { randomNumBetweenExcluding } from '../../helpers/helpers'
import { soundManager } from '../../sounds/SoundManager'
import GameControls from './GameControls'
import GameOverlay from './GameOverlay'
import OverlayChat from '../chat/OverlayChat'
import { usePowerupStore } from '../../stores/powerupStore'
import ShipPickup from '../../game/entities/ShipPickup'
import { useInventoryStore } from '../../stores/inventoryStore'
import LevelDisplay from '../ui/LevelDisplay'
import { useLevelStore } from '../../stores/levelStore'

const KEY = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32,
}

const GameScreen = () => {
  const levelStore = useLevelStore()

  const { state, actions } = useGame()
  const wallet = useWallet()

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
    currentScore: 0,
    asteroidCount: 2,
    shipPickups: [],
    lastShipPickupSpawn: 0,
    shipPickupInterval: 20000, // 20 seconds
    lastShot: 0,
  })

  const requestRef = useRef()

  // Helper function to spawn ship pickups
  const spawnShipPickup = () => {
    if (gameStateRef.current.shipPickups.length === 0) {
      const pickup = new ShipPickup({
        screen: gameStateRef.current.screen,
      })
      createObject(pickup, 'shipPickups')
    }
  }

  // Expose spawnShipPickup to window for external access
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
        addScore: (points) => actions.updateScore(points),
      })
      createObject(asteroid, 'asteroids')
    }
  }

  // Add Zustand inventory store hook
  const addInventoryItem = useInventoryStore((state) => state.addItem)

  const update = () => {
    const gameState = gameStateRef.current
    if (!gameState.context || !gameState.inGame) return

    const context = gameState.context
    context.save()
    context.scale(gameState.screen.ratio, gameState.screen.ratio)

    // Motion trail
    context.fillStyle = '#000'
    context.globalAlpha = 0.4
    context.fillRect(0, 0, gameState.screen.width, gameState.screen.height)
    context.globalAlpha = 1

    // Check spawning timers for pills (keeping original pill system)
    const now = Date.now()
    if (now - gameState.lastPillSpawn > gameState.pillSpawnDelay) {
      const newPill = new Pill({ screen: gameState.screen, type: 'standard' })
      createObject(newPill, 'pills')
      gameState.lastPillSpawn = now
    }

    // Ship pickup spawning check (separate from pill system)
    if (now - gameState.lastShipPickupSpawn >= gameState.shipPickupInterval) {
      spawnShipPickup()
      gameState.lastShipPickupSpawn = now
    }

    // Update game objects
    updateObjects(gameState.particles, 'particles')
    updateObjects(gameState.asteroids, 'asteroids')
    updateObjects(gameState.bullets, 'bullets')
    updateObjects(gameState.pills, 'pills')
    updateObjects(gameState.ship, 'ship')
    updateObjects(gameState.shipPickups, 'shipPickups')

    // Check for collisions
    checkCollisionsWith(gameState.bullets, gameState.asteroids)
    checkCollisionsWith(gameState.ship, gameState.asteroids)

    // Check for pill collisions
    if (gameState.ship[0]) {
      gameState.pills.forEach((pill) => {
        if (checkCollision(gameState.ship[0], pill)) {
          pill.destroy()
          addInventoryItem('pills', 1) // Use Zustand instead of actions
          soundManager.playSound('collect')
          activatePowerups()
          setTimeout(deactivatePowerups, 10000)
        }
      })

      // Check for ship pickup collisions
      gameState.shipPickups.forEach((pickup) => {
        if (checkCollision(gameState.ship[0], pickup)) {
          pickup.destroy()
          addInventoryItem('ships', 1) // Use Zustand instead of actions
          soundManager.playSound('collect')
        }
      })
    }

    // Next set of asteroids
    if (!gameState.asteroids.length) {
      gameState.asteroidCount = Math.min(gameState.asteroidCount + 1, 10)
      useLevelStore.getState().incrementLevel() // Change this line
      generateAsteroids(gameState.asteroidCount)
    }

    // Ship shooting
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

    // Next frame
    requestRef.current = requestAnimationFrame(update)
  }

  const handleGameOver = () => {
    if (gameStateRef.current.inGame) {
      soundManager.transitionMusic('gameMusic', 'gameOverMusic', {
        crossFadeDuration: 1000,
      })
      gameStateRef.current.inGame = false
      levelStore.resetLevel() // Add this line
      actions.endGame()
    }
  }

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

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
          useLevelStore.getState().resetLevel() // Use getState() to access store outside of components
          actions.endGame()
        }
      },
    })
    createObject(ship, 'ship')

    generateAsteroids(gameStateRef.current.asteroidCount)

    // Reset spawn timers
    gameStateRef.current.lastPillSpawn = Date.now()
    gameStateRef.current.lastShipPickupSpawn = Date.now()

    // Initial black background
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

    // Start game loop
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
  }, [state.gameState])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === KEY.LEFT || e.keyCode === KEY.A)
        gameStateRef.current.keys.left = 1
      if (e.keyCode === KEY.RIGHT || e.keyCode === KEY.D)
        gameStateRef.current.keys.right = 1
      if (e.keyCode === KEY.UP || e.keyCode === KEY.W)
        gameStateRef.current.keys.up = 1
      if (e.keyCode === KEY.SPACE) gameStateRef.current.keys.space = 1
      if (e.key.toLowerCase() === 'c') {
        actions.toggleOverlayChat()
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
  }, [])

  return (
    <>
      <GameControls />
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
      <GameOverlay score={state.score} />
      <OverlayChat />
      <LevelDisplay />
    </>
  )
}

export default GameScreen
