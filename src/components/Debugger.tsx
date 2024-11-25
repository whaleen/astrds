// src/components/Debugger.tsx
import React from 'react';
import { useStateMachine } from '@/stores/stateMachine';
import { useOverlayStore } from '@/stores/overlayStore';
import { useEngineStore } from '@/stores/engineStore';
import { Overlay } from '@/types/overlay';
import { MachineState } from '@/types/machine';

const Debugger: React.FC = () => {
  const currentGameState = useStateMachine((state) => state.currentState);
  const isPaused = useStateMachine((state) => state.isPaused);
  const activeOverlay = useOverlayStore((state) => state.activeOverlay);
  const entities = useEngineStore((state) => state.entities);
  const isEngineInitialized = useEngineStore((state) => state.context !== null);

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-black/75 text-white rounded-md z-50">
      <h2 className="text-lg font-bold mb-2">Debugger</h2>
      <div>
        <strong>Current Game State:</strong> {MachineState[currentGameState]}
      </div>
      <div>
        <strong>Is Paused:</strong> {isPaused ? 'Yes' : 'No'}
      </div>
      <div>
        <strong>Active Overlay:</strong> {activeOverlay ? Overlay[activeOverlay] : 'None'}
      </div>
      <div>
        <strong>Engine Initialized:</strong> {isEngineInitialized ? 'Yes' : 'No'}
      </div>
      <div>
        <strong>Entity Counts:</strong>
        <ul>
          <li>Ship: {entities.ship.length}</li>
          <li>Asteroids: {entities.asteroids.length}</li>
          <li>Bullets: {entities.bullets.length}</li>
          <li>Particles: {entities.particles.length}</li>
        </ul>
      </div>
    </div>
  );
};

export default Debugger;
