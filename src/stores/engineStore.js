// src/stores/engineStore.js
import { create } from 'zustand'
import { rotatePoint, randomNumBetween } from '../helpers/helpers'
import { soundManager } from '../sounds/SoundManager'
import { useGameStore } from './gameStore'
import { usePowerupStore } from './powerupStore'
import Bullet from '../game/entities/Bullet'
import Asteroid from '../game/entities/Asteroid'
import Pill from '../game/entities/Pill'
import Token from '../game/entities/Token'
import ShipPickup from '../game/entities/ShipPickup'
import { useInventoryStore } from './inventoryStore'
import { useLevelStore } from './levelStore'

const INITIAL_STATE = {
  entities: {
    ship: [],
    asteroids: [],
    bullets: [],
    particles: [],
    pills: [],
    tokens: [],
    shipPickups: []
  },
  screen: {
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.devicePixelRatio || 1,
  },
  context: null,
  keys: {
    left: 0,
    right: 0,
    up: 0,
    space: 0,
  },
  lastShot: 0,
  asteroidCount: 2,
  gameLoopId: null,
  inGame: false,
  lastPillSpawn: 0,
  pillSpawnDelay: 3000,
  lastShipPickupSpawn: Date.now(), // Initialize with current time
  shipPickupInterval: 20000, // 20 seconds
  lastTokenSpawn: Date.now(),
  tokenSpawnDelay: 5000,
  powerupTimeout: null,
}

export const useEngineStore = create((set, get) => ({
  ...INITIAL_STATE,

  // Initialization
  initializeEngine: (context) => set({ context, inGame: true }),

  // Entity Management
  addEntity: (entity, group) => set((state) => ({
    entities: {
      ...state.entities,
      [group]: [...state.entities[group], entity]
    }
  })),

  removeEntity: (entityId, group) => set((state) => ({
    entities: {
      ...state.entities,
      [group]: state.entities[group].filter(entity => entity.id !== entityId)
    }
  })),

  // Physics & Movement
  updateEntityPosition: (entityId, group, newPosition) => set((state) => ({
    entities: {
      ...state.entities,
      [group]: state.entities[group].map(entity =>
        entity.id === entityId
          ? { ...entity, position: newPosition }
          : entity
      )
    }
  })),

  // Input Handling
  setKey: (key, value) => set((state) => ({
    keys: { ...state.keys, [key]: value }
  })),

  // Collision Detection
  checkCollision: (obj1, obj2) => {
    const vx = obj1.position.x - obj2.position.x
    const vy = obj1.position.y - obj2.position.y
    const length = Math.sqrt(vx * vx + vy * vy)
    return length < obj1.radius + obj2.radius
  },

  checkCollisions: () => {
    const state = get()
    const { ship, asteroids, bullets, pills, tokens, shipPickups } = state.entities
    const powerups = usePowerupStore.getState().powerups

    // Ship collision with asteroids
    if (ship[0] && !powerups.invincible) {
      asteroids.forEach(asteroid => {
        if (state.checkCollision(ship[0], asteroid)) {
          ship[0].destroy()
          asteroid.destroy()
        }
      })
    }

    // Ship collision with pills
    if (ship[0]) {
      pills.forEach(pill => {
        if (state.checkCollision(ship[0], pill)) {
          pill.destroy()
          useInventoryStore.getState().addItem('pills', 1)
          soundManager.playSound('collect')

          // Clear any existing powerup timeout
          if (state.powerupTimeout) {
            clearTimeout(state.powerupTimeout)
          }

          // Activate powerups
          usePowerupStore.getState().activatePowerups()

          // Set new timeout
          const timeout = setTimeout(() => {
            usePowerupStore.getState().deactivatePowerups()
          }, 10000) // 10 seconds

          // Store timeout reference
          set({ powerupTimeout: timeout })
        }
      })
    }


    // Ship collision with tokens
    if (ship[0]) {
      tokens.forEach(token => {
        if (state.checkCollision(ship[0], token)) {
          token.destroy()
          // Make sure we're using the addItem method from inventory store
          useInventoryStore.getState().addItem('tokens', 1)
          soundManager.playSound('collect')
        }
      })
    }

    // Ship collision with ship pickups
    if (ship[0]) {
      shipPickups.forEach(pickup => {
        if (state.checkCollision(ship[0], pickup)) {
          pickup.destroy()
          useInventoryStore.getState().addItem('ships', 1)
          soundManager.playSound('collect')
        }
      })
    }

    // Bullets collision with asteroids
    bullets.forEach(bullet => {
      asteroids.forEach(asteroid => {
        if (state.checkCollision(bullet, asteroid)) {
          bullet.destroy()
          asteroid.destroy()
          useGameStore.getState().addToScore(asteroid.score)
        }
      })
    })
  },


  shootBullet: () => {
    const state = get()
    const ship = state.entities.ship[0]
    const powerups = usePowerupStore.getState().powerups

    if (!ship || ship.delete) return

    const now = Date.now()
    const shootDelay = powerups.rapidFire ? 50 : 250

    if (now - state.lastShot > shootDelay) {
      try {
        const bullet = new Bullet({
          ship,
          powered: powerups.rapidFire
        })
        state.addEntity(bullet, 'bullets')
        state.lastShot = now
      } catch (error) {
        console.warn('Failed to create bullet:', error)
      }
    }
  },

  // Game Loop
  updateGame: () => {
    const state = get()
    if (!state.inGame) return

    // Clear screen with motion trail effect
    const context = state.context
    context.save()
    context.scale(state.screen.ratio, state.screen.ratio)
    context.fillStyle = '#000'
    context.globalAlpha = 0.4
    context.fillRect(0, 0, state.screen.width, state.screen.height)
    context.globalAlpha = 1


    // Check for level advancement
    if (state.entities.asteroids.length === 0) {
      // Increment asteroid count for next level
      set(state => ({
        asteroidCount: Math.min(state.asteroidCount + 1, 10)
      }))

      // Increment level in level store
      useLevelStore.getState().incrementLevel()

      // Spawn new asteroids
      state.spawnAsteroids(state.asteroidCount)
    }


    // Spawn items periodically
    state.spawnPill()
    state.spawnToken()
    state.spawnShipPickup()

    // Update all entities
    Object.entries(state.entities).forEach(([group, entities]) => {
      entities.forEach((entity, index) => {
        if (entity.delete) {
          state.removeEntity(entity.id, group)
        } else {
          entity.render(state)
        }
      })
    })

    // Handle shooting
    if (state.keys.space) {
      state.shootBullet()
    }

    // Check collisions
    state.checkCollisions()

    context.restore()
  },

  startGameLoop: () => {
    const gameLoop = () => {
      get().updateGame()
      const gameLoopId = requestAnimationFrame(gameLoop)
      set({ gameLoopId })
    }
    gameLoop()
  },

  stopGameLoop: () => {
    const { gameLoopId } = get()
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId)
      set({ gameLoopId: null })
    }
  },

  // Asteroid Spawning
  spawnAsteroids: (count) => {
    const state = get()
    const ship = state.entities.ship[0]

    if (!ship) return

    for (let i = 0; i < count; i++) {
      const asteroidX = randomNumBetween(0, state.screen.width)
      const asteroidY = randomNumBetween(0, state.screen.height)

      // Ensure asteroid doesn't spawn too close to ship
      if (Math.abs(asteroidX - ship.position.x) < 100 &&
        Math.abs(asteroidY - ship.position.y) < 100) {
        i--
        continue
      }

      // Create proper Asteroid instance
      const asteroid = new Asteroid({
        size: 40,
        position: { x: asteroidX, y: asteroidY }
      })

      state.addEntity(asteroid, 'asteroids')
    }
  },

  // Pill Spawning
  spawnPill: () => {
    const state = get()
    const now = Date.now()

    if (now - state.lastPillSpawn > state.pillSpawnDelay) {
      const pill = new Pill({
        screen: state.screen,
        type: 'standard'
      })
      state.addEntity(pill, 'pills')
      set({ lastPillSpawn: now })
    }
  },

  // Token Spawning
  spawnToken: () => {
    const state = get()
    const now = Date.now()

    if (now - state.lastTokenSpawn > state.tokenSpawnDelay) {
      const token = new Token({
        screen: state.screen,
        type: 'standard'
      })
      state.addEntity(token, 'tokens')
      set({ lastTokenSpawn: now })
    }
  },

  spawnShipPickup: () => {
    const state = get()
    const now = Date.now()

    // Only spawn if none exist and enough time has passed
    if (state.entities.shipPickups.length === 0 &&
      now - state.lastShipPickupSpawn >= state.shipPickupInterval) {
      const pickup = new ShipPickup({
        screen: state.screen
      })
      state.addEntity(pickup, 'shipPickups')
      set({ lastShipPickupSpawn: now })
    }
  },

  // Cleanup & Reset
  resetEngine: () => {
    const state = get()
    if (state.powerupTimeout) {
      clearTimeout(state.powerupTimeout)
    }
    state.stopGameLoop()
    set(INITIAL_STATE)
  },

  // Pause Management
  togglePause: () => set((state) => {
    if (state.gameLoopId) {
      state.stopGameLoop()
    } else {
      state.startGameLoop()
    }
    return { inGame: !state.inGame }
  })
}))
