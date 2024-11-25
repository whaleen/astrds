// src/components/Debugger.tsx
import React from 'react';
import { useStateMachine } from '@/stores/stateMachine';
import { useOverlayStore } from '@/stores/overlayStore';
import { useEngineStore } from '@/stores/engineStore';
import { useGameData } from '@/stores/gameData';
import { Overlay } from '@/types/overlay';
import { MachineState } from '@/types/machine';

const Debugger: React.FC = () => {
  const currentGameState = useStateMachine((state) => state.currentState);
  const isPaused = useStateMachine((state) => state.isPaused);
  const activeOverlay = useOverlayStore((state) => state.activeOverlay);
  const entities = useEngineStore((state) => state.entities);
  const isEngineInitialized = useEngineStore((state) => state.context !== null);
  const { currentSessionId, sessionTokens } = useGameData();

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/75 text-white rounded-md z-50">
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

      {/* Session Debug Info */}
      <div className="mt-4 border-t border-white/20 pt-2">
        <h3 className="text-sm font-bold text-game-blue">Game Session</h3>
        <div>
          <strong>Session ID:</strong> {currentSessionId || 'None'}
        </div>
        <div>
          <strong>Tokens Collected:</strong> {sessionTokens.length}
        </div>
        {sessionTokens.length > 0 && (
          <div className="text-xs mt-1">
            {sessionTokens.map((token, i) => (
              <div key={i} className="text-gray-300">
                {token.symbol}: {token.amount} {token.verified ? '✓' : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-white/20 pt-2">
        <h3 className="text-sm font-bold text-game-blue">Entity Counts</h3>
        <ul>
          <li>Ship: {entities.ship.length}</li>
          <li>Asteroids: {entities.asteroids.length}</li>
          <li>Bullets: {entities.bullets.length}</li>
          <li>Tokens: {entities.tokens.length}</li>
          <li>Particles: {entities.particles.length}</li>
        </ul>
      </div>
    </div>
  );
};

export default Debugger;
