// src/game/entities/Particle.js
import { particleSystem } from '../systems/ParticleSystem';

export default class Particle {
  constructor(args) {
    this.id = `particle-${Date.now()}-${Math.random()}`;
    this.init(args);
  }

  init(args) {
    this.position = { ...args.position };
    this.velocity = { ...args.velocity };
    this.radius = args.size;
    this.lifeSpan = args.lifeSpan;
    this.inertia = 0.98;
    this.delete = false;
  }

  destroy() {
    console.log('Particle destroying:', this.id);
    this.delete = true;
    // Release this particle back to the pool
    particleSystem.releaseParticle(this);
  }

  render(state) {
    // Move
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.x *= this.inertia;
    this.velocity.y *= this.inertia;

    // Shrink
    this.radius -= 0.1;
    if (this.radius < 0.1) {
      this.radius = 0.1;
    }

    // Check lifespan first
    if (this.lifeSpan-- < 0) {
      this.destroy();
      return;
    }

    // Only draw if not deleted
    if (!this.delete) {
      const context = state.context;
      context.save();
      context.translate(this.position.x, this.position.y);
      context.fillStyle = 'orange';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, -this.radius);
      context.arc(0, 0, this.radius, 0, 2 * Math.PI);
      context.closePath();
      context.fill();
      context.restore();
    }
  }
}
