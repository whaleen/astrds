// src/components/chat/OverlayChat.jsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useChatStore } from '@/stores/chatStore'
import { User } from 'lucide-react'
import { getChatMessages } from '@/api/chat'
import { gameChannel } from '@/api/pusher'

const shortenAddress = (address) => {
  if (!address || address === 'Anonymous') return 'Anonymous'
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const OverlayChat = () => {
  const wallet = useWallet()
  const [newMessage, setNewMessage] = React.useState('')
  const { messages, overlayVisible, isPaused, addMessage } = useChatStore()

  // Load messages when component mounts and handle real-time updates
  useEffect(() => {
    let mounted = true

    const loadInitialMessages = async () => {
      try {
        await getChatMessages()
      } catch (error) {
        console.error('Failed to load chat messages:', error)
      }
    }

    // Load initial messages
    loadInitialMessages()

    // Set up real-time message handler
    const handleNewMessage = (message) => {
      if (mounted) {
        addMessage(message)
      }
    }

    // Subscribe to new messages
    if (gameChannel) {
      gameChannel.bind('new-message', handleNewMessage)
    }

    // Cleanup
    return () => {
      mounted = false
      if (gameChannel) {
        gameChannel.unbind('new-message', handleNewMessage)
      }
    }
  }, [addMessage])

  // Take only the last 5 messages
  const recentMessages = messages.slice(-20)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !wallet.connected || !isPaused) return

    const message = {
      id: Date.now().toString(),
      walletAddress: wallet.publicKey.toString(),
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    addMessage(message)
    setNewMessage('')
  }

  return (
    <div
      className={`fixed right-4 top-20 w-64 rounded-xs flex flex-col z-20
            transition-all duration-300 ${
              !overlayVisible
                ? 'translate-x-0'
                : 'translate-x-full pointer-events-none'
            }`}
      style={{ height: 'calc(90vh - 5rem)' }}
    >
      {/* Backdrop layer */}
      <div className='absolute inset-0 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xs' />

      {/* Content layer - now fully opaque */}
      <div className='relative flex flex-col h-full'>
        {' '}
        {/* Added relative positioning and h-full */}
        <div className='p-2 border-b border-white/10 flex justify-between items-center'>
          <span className='text-[10px] text-white'>Game Chat</span>
          {!isPaused ? (
            <span className='text-[10px] text-game-blue'>[Pause] to chat</span>
          ) : (
            <span className='text-[10px] text-game-green'>Chat Active</span>
          )}
        </div>
        <div className='flex-1 p-4 flex flex-col justify-end'>
          <div className='space-y-1'>
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`text-[10px] break-words flex items-center gap-2 ${
                  msg.walletAddress === wallet.publicKey?.toString()
                    ? 'text-white'
                    : 'text-white/70'
                }`}
              >
                <div className='w-4 h-4 rounded-full  flex items-center justify-center'>
                  <User className='w-3 h-3 text-game-blue' />
                </div>
                <div>
                  <span className='text-game-blue'>
                    {shortenAddress(msg.walletAddress)}:
                  </span>{' '}
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </div>
        {isPaused && (
          <form
            onSubmit={handleSubmit}
            className='p-1 border-t border-white/10'
          >
            <div className='flex gap-1'>
              <input
                type='text'
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder='Message...'
                maxLength={100}
                className='flex-1 bg-black/30 border border-white/10 rounded px-1 py-0.5
                           text-[10px] text-white/80 placeholder:text-white/30
                           focus:outline-none focus:border-game-blue'
              />
              <button
                type='submit'
                disabled={!newMessage.trim()}
                className='px-1 py-0.5 text-[10px] bg-game-blue/20 text-game-blue rounded
                           hover:bg-game-blue/30 disabled:opacity-50 
                           disabled:cursor-not-allowed'
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default OverlayChat
