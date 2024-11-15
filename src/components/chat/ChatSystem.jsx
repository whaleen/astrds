// src/components/chat/ChatSystem.jsx
import React from 'react'
import FullChat from './FullChat'
import OverlayChat from './OverlayChat'
import { useChatStore } from '@/stores/chatStore'

const ChatSystem = () => {
  const chatMode = useChatStore((state) => state.chatMode)
  const closeChat = useChatStore((state) => state.closeChat)

  // Render both chat types, let their visibility be controlled by their own state
  return (
    <>
      {chatMode === 'full' && <FullChat onClose={closeChat} />}
      <OverlayChat />
    </>
  )
}

export default ChatSystem
