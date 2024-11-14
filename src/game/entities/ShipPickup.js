// src/game/entities/ShipPickup.js
import { soundManager } from '../../sounds/SoundManager'

export default class ShipPickup {
  constructor(args) {
    this.id = `ship-pickup-${Date.now()}-${Math.random()}`
    this.position = {
      x: Math.floor(Math.random() * args.screen.width),
      y: Math.floor(Math.random() * args.screen.height)
    }
    this.radius = 20
    this.delete = false
  }

  destroy() {
    this.delete = true
    soundManager.playSound('collect')
  }

  render(state) {
    const context = state.context

    // Set up subtle pulsing effect for the circle outline
    const pulseScale = 1 + Math.sin(Date.now() / 300) * 0.05

    context.save()
    context.translate(this.position.x, this.position.y)
    context.scale(pulseScale, pulseScale)

    // Draw a smaller pulsing, glowing white circle outline behind the ship shape
    context.beginPath()
    context.arc(0, 0, this.radius - 5, 0, Math.PI * 2)  // Slightly smaller radius
    context.strokeStyle = '#FFFFFF'
    context.lineWidth = 1  // Outline thickness
    context.shadowBlur = 10   // Glow effect
    context.shadowColor = '#FFFFFF'
    context.stroke()  // Draw only the outline, no fill

    // Reset shadow settings for the ship shape
    context.shadowBlur = 0

    // Draw the ship shape with a blue outline only, no fill
    context.strokeStyle = '#1E90FF'  // Solid blue outline
    context.lineWidth = 1    // Thin outline

    context.beginPath()
    context.moveTo(0, -15)
    context.lineTo(10, 10)
    context.lineTo(5, 7)
    context.lineTo(-5, 7)
    context.lineTo(-10, 10)
    context.closePath()
    context.stroke()  // Outline only, no fill

    context.restore()
  }


}
