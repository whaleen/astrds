// src/components/chat/ChatSystem.tsx
import React, { useEffect } from 'react'
import FullChat from './FullChat'
import OverlayChat from './OverlayChat'
import { useChatStore } from '@/stores/chatStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { useKeyboardCommands } from '@/hooks/useKeyboardCommands'
import { MachineState } from '@/types/machine'
// import { useGameStateStore } from '@/stores/gameStateStore'
import { useStateMachine } from '@/stores/stateMachine'

const ChatSystem: React.FC = () => {
  const { connected } = useWallet()
  const {
    chatMode,
    overlayVisible,
    closeChat,
    initializeChat,
    toggleOverlay
  } = useChatStore()

  const currentGameState = useStateMachine(state => state.currentState)

  // Only allow chat toggle during gameplay
  useKeyboardCommands({
    key: 'KeyC',
    action: () => {
      if (currentGameState === MachineState.PLAYING ||
        currentGameState === MachineState.PAUSED) {
        toggleOverlay()
      }
    },
    description: 'Toggle Chat',
  })

  useEffect(() => {
    if (connected) {
      initializeChat().catch(console.error)
    }
  }, [connected, initializeChat])

  return (
    <>
      {chatMode === 'full' && (
        <FullChat
          onClose={closeChat}
          onPlayClick={() => { }}
        />
      )}
      {overlayVisible && <OverlayChat />}
    </>
  )
}

export default ChatSystem
