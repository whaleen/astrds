// src/components/chat/ChatSystem.jsx
import React from 'react'
// import { useGame } from '../../hooks/useGame'
import FullChat from './FullChat'
import OverlayChat from './OverlayChat'
import { useChatStore } from '../../stores/chatStore'

const ChatSystem = () => {
  // const { state, actions } = useGame()
  const { chatMode, closeChat } = useChatStore()

  // Render both chat types, let their visibility be controlled by their own state
  return (
    <>
      {chatMode === 'full' && <FullChat onClose={closeChat} />}
      <OverlayChat />
    </>
  )
}

export default ChatSystem
