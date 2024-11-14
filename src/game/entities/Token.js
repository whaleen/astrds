// src/game/entities/Token.js
import { randomNumBetween } from '../../helpers/helpers'

export default class Token {
  constructor(args) {
    this.id = `token-${Date.now()}-${Math.random()}`
    this.radius = 8
    this.delete = false

    // Position calculation from screen edge
    const edge = Math.floor(Math.random() * 4)
    const screen = args.screen

    switch (edge) {
      case 0: // Top
        this.position = {
          x: Math.random() * screen.width,
          y: -this.radius
        }
        break
      case 1: // Right
        this.position = {
          x: screen.width + this.radius,
          y: Math.random() * screen.height
        }
        break
      case 2: // Bottom
        this.position = {
          x: Math.random() * screen.width,
          y: screen.height + this.radius
        }
        break
      case 3: // Left
        this.position = {
          x: -this.radius,
          y: Math.random() * screen.height
        }
        break
    }

    this.velocity = {
      x: randomNumBetween(-1.5, 1.5),
      y: randomNumBetween(-1.5, 1.5)
    }

    this.type = args.type || 'standard'
    this.timeToLive = 15 * 1000 // 15 seconds lifetime
    this.creation = Date.now()
    this.color = '#FF642D'
    this.pulseRate = 0.05
    this.pulsePhase = 0
  }

  destroy() {
    this.delete = true
  }

  render(state) {
    // Move
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // Screen wrapping
    if (this.position.x > state.screen.width + this.radius)
      this.position.x = -this.radius
    else if (this.position.x < -this.radius)
      this.position.x = state.screen.width + this.radius
    if (this.position.y > state.screen.height + this.radius)
      this.position.y = -this.radius
    else if (this.position.y < -this.radius)
      this.position.y = state.screen.height + this.radius

    // Check if token should expire
    if (Date.now() - this.creation > this.timeToLive) {
      this.destroy()
    }

    // Pulsing animation
    this.pulsePhase += this.pulseRate
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.2
    const currentRadius = this.radius * pulseScale

    // Draw
    const context = state.context
    context.save()
    context.translate(this.position.x, this.position.y)

    // Subtle glow
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, currentRadius * 1.5)
    gradient.addColorStop(0, this.color)
    gradient.addColorStop(1, 'rgba(255, 100, 45, 0)')

    context.fillStyle = gradient
    context.beginPath()
    context.arc(0, 0, currentRadius * 1.5, 0, 2 * Math.PI)
    context.fill()

    // Main token
    context.fillStyle = this.color
    context.beginPath()
    context.arc(0, 0, currentRadius, 0, 2 * Math.PI)
    context.fill()

    context.restore()
  }
}
