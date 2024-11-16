// src/hooks/usePhantom.js
import { useEffect } from 'react'
import { phantomService } from '../services/wallet/PhantomService'
import { useGameStore } from '../stores/gameStore'

export const usePhantom = () => {
  const setGameState = useGameStore(state => state.setGameState)

  useEffect(() => {
    // Set up disconnect handler
    phantomService.onDisconnect(() => {
      console.log('Handling wallet disconnect')
      setGameState('INITIAL')
    })

    // Attempt auto-connect
    phantomService.attemptAutoConnect()

    // Cleanup on unmount
    return () => {
      phantomService.onDisconnect(null)
      const provider = phantomService.getProvider()
      if (provider) {
        provider.removeAllListeners('disconnect')
      }
    }
  }, [setGameState])
}
