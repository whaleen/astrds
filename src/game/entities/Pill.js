// src/game/entities/Pill.js
import { randomNumBetween } from '../../helpers/helpers'

export default class Pill {
  constructor(args) {
    this.radius = 8 // Back to smaller size

    // Position calculation
    const edge = Math.floor(Math.random() * 4)

    switch (edge) {
      case 0: // Top
        this.position = {
          x: Math.random() * args.screen.width,
          y: -this.radius
        }
        break
      case 1: // Right
        this.position = {
          x: args.screen.width + this.radius,
          y: Math.random() * args.screen.height
        }
        break
      case 2: // Bottom
        this.position = {
          x: Math.random() * args.screen.width,
          y: args.screen.height + this.radius
        }
        break
      case 3: // Left
        this.position = {
          x: -this.radius,
          y: Math.random() * args.screen.height
        }
        break
    }

    this.velocity = {
      x: randomNumBetween(-1.5, 1.5),
      y: randomNumBetween(-1.5, 1.5)
    }

    this.delete = false
    this.type = args.type || 'standard'
    this.timeToLive = 15 * 1000 // 15 seconds lifetime
    this.creation = Date.now()

    this.color = '#4dc1f9' // Back to blue
    this.pulseRate = 0.05 // Slower pulse
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

    // Check if pill should expire
    if (Date.now() - this.creation > this.timeToLive) {
      this.destroy()
    }

    // Subtler pulsing animation
    this.pulsePhase += this.pulseRate
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.2 // Reduced pulse amplitude
    const currentRadius = this.radius * pulseScale

    // Draw
    const context = state.context
    context.save()
    context.translate(this.position.x, this.position.y)

    // Subtle glow
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, currentRadius * 1.5)
    gradient.addColorStop(0, this.color)
    gradient.addColorStop(1, 'rgba(77, 193, 249, 0)')

    context.fillStyle = gradient
    context.beginPath()
    context.arc(0, 0, currentRadius * 1.5, 0, 2 * Math.PI)
    context.fill()

    // Main pill
    context.fillStyle = this.color
    context.beginPath()
    context.arc(0, 0, currentRadius, 0, 2 * Math.PI)
    context.fill()

    context.restore()
  }
}
