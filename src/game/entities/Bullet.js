// src/game/entities/Bullet.js
import { rotatePoint } from '../../helpers/helpers'
import { soundManager } from '../../sounds/SoundManager'

export default class Bullet {
  constructor(args) {
    if (!args.ship || typeof args.ship.rotation !== 'number') {
      console.error('Invalid ship object passed to Bullet constructor:', args.ship)
      throw new Error('Cannot create bullet: invalid ship object')
    }

    this.id = `bullet-${Date.now()}-${Math.random()}`

    // Calculate bullet position relative to ship
    let posDelta = rotatePoint(
      { x: 0, y: -20 },
      { x: 0, y: 0 },
      (args.ship.rotation * Math.PI) / 180
    )

    this.position = {
      x: args.ship.position.x + posDelta.x,
      y: args.ship.position.y + posDelta.y,
    }

    this.rotation = args.ship.rotation
    this.velocity = {
      x: posDelta.x / 2,
      y: posDelta.y / 2,
    }
    this.radius = args.powered ? 3 : 2 // Bigger bullets when powered
    this.powered = args.powered
    this.delete = false

    soundManager.playSound('shoot')
  }

  destroy() {
    this.delete = true
  }

  render(state) {
    // Move
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // Delete if it goes out of bounds
    if (
      this.position.x < 0 ||
      this.position.y < 0 ||
      this.position.x > state.screen.width ||
      this.position.y > state.screen.height
    ) {
      this.destroy()
    }

    // Draw
    const context = state.context
    context.save()
    context.translate(this.position.x, this.position.y)
    context.rotate((this.rotation * Math.PI) / 180)
    context.fillStyle = this.powered ? '#4dc1f9' : '#03aef3' // Different color when powered
    context.lineWidth = 0.5
    context.beginPath()
    context.arc(0, 0, this.radius, 0, 2 * Math.PI)
    context.closePath()
    context.fill()
    context.restore()
  }
}
