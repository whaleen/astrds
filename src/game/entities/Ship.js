// src/game/entities/Ship.js
import { rotatePoint } from '@/utils/helpers'
import { useGameStore } from '../../stores/gameStore'
import { usePowerupStore } from '../../stores/powerupStore'
import { useEngineStore } from '../../stores/engineStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { particleSystem } from '../systems/ParticleSystem' // Add this import
import { audioService } from '../../services/audio/AudioService'

export default class Ship {
  constructor(args) {
    this.id = `ship-${Date.now()}`
    this.position = args.position
    this.velocity = {
      x: 0,
      y: 0,
    }
    this.rotation = 0
    this.rotationSpeed = 4
    this.speed = 0.15
    this.inertia = 0.99
    this.radius = 20
    this.lastShot = 0
    this.onDie = args.onDie
    this.delete = false
    this.isInvulnerable = args.isRespawning || false
    this.invulnerabilityTime = args.isRespawning ? Date.now() : 0
  }

  destroy() {
    const powerups = usePowerupStore.getState().powerups
    if (powerups.invincible || this.isInvulnerable) return

    this.delete = true
    audioService.playSound('explosion')

    // Use particleSystem for explosion particles
    particleSystem.createExplosion(
      this.position,
      this.radius,
      60  // Fixed number for ship explosion
    )

    // Check for extra ships
    const inventory = useInventoryStore.getState()
    console.log('Ships remaining:', inventory.items.ships)

    if (inventory.items.ships > 0) {
      console.log('Using a ship from inventory')

      // Update inventory state directly
      useInventoryStore.setState(state => ({
        items: {
          ...state.items,
          ships: state.items.ships - 1
        }
      }))

      // Respawn with brief invulnerability
      setTimeout(() => {
        const engineStore = useEngineStore.getState()
        const screen = engineStore.screen
        const newShip = new Ship({
          position: {
            x: screen.width / 2,
            y: screen.height / 2
          },
          isRespawning: true,
          onDie: this.onDie
        })
        console.log('Spawning new ship with invulnerability')
        engineStore.addEntity(newShip, 'ship')
      }, 2000)
    } else {
      console.log('No ships left - game over')
      // No ships left - game over
      const gameStore = useGameStore.getState()
      const wallet = window.solana?.publicKey?.toString()

      if (wallet) {
        gameStore.submitFinalScore(wallet)
          .then(() => {
            this.onDie?.()
          })
      } else {
        this.onDie?.()
      }
    }

    // Create explosion particles
    // for (let i = 0; i < 60; i++) {
    //   const particle = new Particle({
    //     lifeSpan: randomNumBetween(60, 100),
    //     size: randomNumBetween(1, 4),
    //     position: {
    //       x: this.position.x + randomNumBetween(-this.radius / 4, this.radius / 4),
    //       y: this.position.y + randomNumBetween(-this.radius / 4, this.radius / 4),
    //     },
    //     velocity: {
    //       x: randomNumBetween(-1.5, 1.5),
    //       y: randomNumBetween(-1.5, 1.5),
    //     },
    //   })
    //   useEngineStore.getState().addEntity(particle, 'particles')
    // }
  }

  rotate(dir) {
    if (dir === 'LEFT') {
      this.rotation -= this.rotationSpeed
    }
    if (dir === 'RIGHT') {
      this.rotation += this.rotationSpeed
    }
  }

  accelerate() {
    this.velocity.x -= Math.sin((-this.rotation * Math.PI) / 180) * this.speed
    this.velocity.y -= Math.cos((-this.rotation * Math.PI) / 180) * this.speed

    // Play thrust sound
    audioService.playSound('thrust')

    // Only create particle every other frame or so
    if (Math.random() > 0.5) {  // 50% chance each frame
      let posDelta = rotatePoint(
        { x: 0, y: -10 },
        { x: 0, y: 0 },
        ((this.rotation - 180) * Math.PI) / 180
      )
      particleSystem.createThrusterParticle(this.position, posDelta)
    }
  }

  render(state) {
    // Update invulnerability
    if (this.isInvulnerable && Date.now() - this.invulnerabilityTime > 3000) {
      this.isInvulnerable = false
    }

    // Handle ship controls
    if (state.keys.left) this.rotate('LEFT')
    if (state.keys.right) this.rotate('RIGHT')
    if (state.keys.up) this.accelerate()

    // Move
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    this.velocity.x *= this.inertia
    this.velocity.y *= this.inertia

    // Rotation
    if (this.rotation >= 360) {
      this.rotation -= 360
    }
    if (this.rotation < 0) {
      this.rotation += 360
    }

    // Screen edges
    if (this.position.x > state.screen.width) this.position.x = 0
    else if (this.position.x < 0) this.position.x = state.screen.width
    if (this.position.y > state.screen.height) this.position.y = 0
    else if (this.position.y < 0) this.position.y = state.screen.height

    // Draw
    const context = state.context
    context.save()
    context.translate(this.position.x, this.position.y)

    // Add invulnerability effect
    if (this.isInvulnerable || usePowerupStore.getState().powerups.invincible) {
      context.shadowColor = '#4dc1f9'
      context.shadowBlur = 10
      const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1
      context.scale(pulseScale, pulseScale)
    }

    context.rotate((this.rotation * Math.PI) / 180)
    context.strokeStyle = '#ffffff'
    context.fillStyle = '#000000'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(0, -15)
    context.lineTo(10, 10)
    context.lineTo(5, 7)
    context.lineTo(-5, 7)
    context.lineTo(-10, 10)
    context.closePath()
    context.fill()
    context.stroke()
    context.restore()
  }
}
