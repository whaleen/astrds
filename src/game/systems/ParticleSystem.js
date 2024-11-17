// src/game/systems/ParticleSystem.js
import Particle from '../entities/Particle';
import { useEngineStore } from '@/stores/engineStore';
import { randomNumBetween } from '@/utils/helpers';

export class ParticleSystem {
  constructor(maxParticles = 100) {
    console.log('Initializing ParticleSystem with max particles:', maxParticles);

    // Initialize with maximum particle limit
    this.maxParticles = maxParticles;

    // Create initial pool array filled with inactive slots
    this.pool = Array(maxParticles).fill(null).map(() => ({
      particle: null,  // Will hold the actual particle instance
      active: false    // Tracks if particle is in use
    }));
  }

  createParticle(args) {
    const activeCount = this.pool.filter(item => item.active).length;
    console.log('Creating particle. Active count:', activeCount);

    if (activeCount >= this.maxParticles) {
      // If we're at max, forcibly recycle the oldest particle
      const oldestSlot = this.pool.find(item => item.active);
      if (oldestSlot) {
        console.log('Recycling oldest particle');
        oldestSlot.particle.destroy(); // This will release it back to pool
      }
    }

    // Find first inactive slot
    const slot = this.pool.find(item => !item.active);
    if (!slot) {
      console.log('No available slot found even after recycling');
      return null;
    }

    // Either create new particle or reuse existing one
    if (!slot.particle) {
      console.log('Creating new particle instance');
      slot.particle = new Particle(args);
    } else {
      console.log('Reusing existing particle');
      slot.particle.init(args);
    }

    slot.active = true;

    // Add to engine store
    const engineStore = useEngineStore.getState();
    console.log('Adding particle to engine:', slot.particle.id);
    engineStore.addEntity(slot.particle, 'particles');

    return slot.particle;
  }

  releaseParticle(particle) {
    console.log('Attempting to release particle:', particle.id);

    // Find the particle in our pool and mark it as inactive
    const slot = this.pool.find(item => item.particle === particle);
    if (slot) {
      console.log('Found slot for particle, marking inactive');

      slot.active = false;

      // Remove from engine store here as well
      useEngineStore.getState().removeEntity(particle.id, 'particles');
    } else {
      console.warn('Particle not found in pool:', particle.id);
    }
  }

  // Helper method to create explosion particles
  createExplosion(position, radius, count) {
    const particleCount = Math.min(count, 15);  // Reduced max count
    for (let i = 0; i < particleCount; i++) {
      this.createParticle({
        size: randomNumBetween(1, 2),  // Slightly smaller
        position: {
          x: position.x + randomNumBetween(-radius / 4, radius / 4),
          y: position.y + randomNumBetween(-radius / 4, radius / 4)
        },
        velocity: {
          x: randomNumBetween(-1.5, 1.5),
          y: randomNumBetween(-1.5, 1.5)
        },
        lifeSpan: randomNumBetween(20, 40)  // Shorter lifespan
      });
    }
  }

  // Helper method to create thruster particles
  createThrusterParticle(position, posDelta) {
    this.createParticle({
      size: randomNumBetween(1, 2),  // Slightly smaller
      position: {
        x: position.x + posDelta.x + randomNumBetween(-2, 2),
        y: position.y + posDelta.y + randomNumBetween(-2, 2)
      },
      velocity: {
        x: posDelta.x / randomNumBetween(3, 5),
        y: posDelta.y / randomNumBetween(3, 5)
      },
      lifeSpan: randomNumBetween(15, 30)  // Shorter lifespan
    });
  }
}

// Create and export a singleton instance
export const particleSystem = new ParticleSystem(50);
