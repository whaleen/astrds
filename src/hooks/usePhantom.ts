// src/hooks/usePhantom.ts
import { useEffect } from 'react'
import { phantomService } from '../services/wallet/PhantomService'
import { useStateMachine } from '../stores/stateMachine'
import { MachineState } from '@/types/machine'

export const usePhantom = () => {
  const setState = useStateMachine((state) => state.setState)

  useEffect(() => {
    // Set up disconnect handler
    phantomService.onDisconnect(() => {
      console.log('Handling wallet disconnect')
      setState(MachineState.INITIAL)
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
  }, [setState])
}
