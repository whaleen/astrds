// src/game/entities/Ship.js
import Bullet from './Bullet'
import Particle from './Particle'
import { rotatePoint, randomNumBetween } from '../../helpers/helpers'
import { soundManager } from '../../sounds/SoundManager'
import { usePowerupStore } from '../../stores/powerupStore'
import { useGameStore } from '../../stores/gameStore'

export default class Ship {
  constructor(args) {
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
    this.create = args.create
    this.onDie = args.onDie
  }

  destroy() {
    // Don't destroy if invincible
    const powerups = usePowerupStore.getState().powerups
    if (powerups.invincible) return

    this.delete = true
    soundManager.playSound('explosion')

    // Submit final score before game over
    const gameStore = useGameStore.getState()
    const wallet = window.solana?.publicKey?.toString()

    if (wallet) {
      gameStore.submitFinalScore(wallet)
        .then(() => this.onDie())
    } else {
      this.onDie()
    }

    // Explode
    for (let i = 0; i < 60; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 4),
        position: {
          x: this.position.x + randomNumBetween(-this.radius / 4, this.radius / 4),
          y: this.position.y + randomNumBetween(-this.radius / 4, this.radius / 4),
        },
        velocity: {
          x: randomNumBetween(-1.5, 1.5),
          y: randomNumBetween(-1.5, 1.5),
        },
      })
      this.create(particle, 'particles')
    }
  }

  rotate(dir) {
    if (dir == 'LEFT') {
      this.rotation -= this.rotationSpeed
    }
    if (dir == 'RIGHT') {
      this.rotation += this.rotationSpeed
    }
  }

  accelerate(val) {
    this.velocity.x -= Math.sin((-this.rotation * Math.PI) / 180) * this.speed
    this.velocity.y -= Math.cos((-this.rotation * Math.PI) / 180) * this.speed

    // Play thrust sound
    soundManager.playSound('thrust')

    // Thruster particles
    let posDelta = rotatePoint(
      { x: 0, y: -10 },
      { x: 0, y: 0 },
      ((this.rotation - 180) * Math.PI) / 180
    )
    const particle = new Particle({
      lifeSpan: randomNumBetween(20, 40),
      size: randomNumBetween(1, 3),
      position: {
        x: this.position.x + posDelta.x + randomNumBetween(-2, 2),
        y: this.position.y + posDelta.y + randomNumBetween(-2, 2),
      },
      velocity: {
        x: posDelta.x / randomNumBetween(3, 5),
        y: posDelta.y / randomNumBetween(3, 5),
      },
    })
    this.create(particle, 'particles')
  }

  render(state) {
    const powerups = usePowerupStore.getState().powerups

    // Controls
    if (state.keys.up) {
      this.accelerate(1)
    }
    if (state.keys.left) {
      this.rotate('LEFT')
    }
    if (state.keys.right) {
      this.rotate('RIGHT')
    }

    // Shooting with powerup check
    const shootingDelay = powerups.rapidFire ? 50 : 250
    if (state.keys.space && Date.now() - this.lastShot > shootingDelay) {
      const bullet = new Bullet({
        ship: this,
        powered: powerups.rapidFire
      })
      this.create(bullet, 'bullets')
      this.lastShot = Date.now()
      soundManager.playSound('shoot')
    }

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

    // Add invincibility effect
    if (powerups.invincible) {
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