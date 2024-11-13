// src/game/entities/Asteroid.js
import Particle from './Particle'
import { asteroidVertices, randomNumBetween } from '../../helpers/helpers'
import { soundManager } from '../../sounds/SoundManager'
import { useGameStore } from '../../stores/gameStore'

export default class Asteroid {
  constructor(args) {
    this.position = args.position
    this.velocity = {
      x: randomNumBetween(-1.5, 1.5),
      y: randomNumBetween(-1.5, 1.5),
    }
    this.rotation = 0
    this.rotationSpeed = randomNumBetween(-1, 1)
    this.radius = args.size
    // Ensure score calculation results in a valid number
    this.score = Math.floor((80 / Math.max(1, this.radius)) * 5)
    this.create = args.create
    this.vertices = asteroidVertices(8, args.size)
  }

  destroy() {
    this.delete = true
    soundManager.playSound('explosion')

    // Add points using the new addToScore method
    const gameStore = useGameStore.getState()
    const scoreToAdd = Math.max(0, Math.floor(this.score))
    gameStore.addToScore(scoreToAdd)

    // Explode
    for (let i = 0; i < this.radius; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 3),
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

    // Break into smaller asteroids
    if (this.radius > 10) {
      for (let i = 0; i < 2; i++) {
        let asteroid = new Asteroid({
          size: this.radius / 2,
          position: {
            x: randomNumBetween(-10, 20) + this.position.x,
            y: randomNumBetween(-10, 20) + this.position.y,
          },
          create: this.create.bind(this),
        })
        this.create(asteroid, 'asteroids')
      }
    }
  }

  render(state) {
    // Move
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // Rotation
    this.rotation += this.rotationSpeed
    if (this.rotation >= 360) {
      this.rotation -= 360
    }
    if (this.rotation < 0) {
      this.rotation += 360
    }

    // Screen edges
    if (this.position.x > state.screen.width + this.radius)
      this.position.x = -this.radius
    else if (this.position.x < -this.radius)
      this.position.x = state.screen.width + this.radius
    if (this.position.y > state.screen.height + this.radius)
      this.position.y = -this.radius
    else if (this.position.y < -this.radius)
      this.position.y = state.screen.height + this.radius

    // Draw
    const context = state.context
    context.save()
    context.translate(this.position.x, this.position.y)
    context.rotate((this.rotation * Math.PI) / 180)
    context.strokeStyle = '#FFF'
    context.lineWidth = 0.4
    context.beginPath()
    context.moveTo(0, -this.radius)
    for (let i = 1; i < this.vertices.length; i++) {
      context.lineTo(this.vertices[i].x, this.vertices[i].y)
    }
    context.closePath()
    context.stroke()
    context.restore()
  }
}

