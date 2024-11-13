// src/game/entities/ShipPickup.js
import { soundManager } from '../../sounds/SoundManager';

export default class ShipPickup {
  constructor(args) {
    this.position = {
      x: Math.floor(Math.random() * args.screen.width),
      y: Math.floor(Math.random() * args.screen.height)
    };
    this.radius = 20;
    this.delete = false;
  }

  destroy() {
    this.delete = true;
    soundManager.playSound('collect');
  }

  render(state) {
    const context = state.context;

    context.save();
    context.translate(this.position.x, this.position.y);

    // Add subtle pulsing effect
    const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
    context.scale(pulseScale, pulseScale);

    // Glow effect
    context.shadowColor = '#4dc1f9';
    context.shadowBlur = 10;

    // Ship shape
    context.strokeStyle = '#ffffff';
    context.fillStyle = '#000000';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -15);
    context.lineTo(10, 10);
    context.lineTo(5, 7);
    context.lineTo(-5, 7);
    context.lineTo(-10, 10);
    context.closePath();
    context.fill();
    context.stroke();

    context.restore();
  }
}
