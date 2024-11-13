// src/components/chat/OverlayChat.jsx
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useChatStore } from '../../stores/chatStore'

const shortenAddress = (address) => {
  if (!address || address === 'Anonymous') return 'Anonymous'
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const OverlayChat = () => {
  const wallet = useWallet()
  const [newMessage, setNewMessage] = useState('')

  // Use Zustand store
  const { messages, overlayVisible, isPaused, addMessage } = useChatStore()

  // Take only the last 5 messages
  const recentMessages = messages.slice(-5)

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
      className={`fixed right-4 top-20 w-64 bg-black/30 backdrop-blur-sm 
            border border-white/10 rounded-xs flex flex-col z-20
            transition-all duration-300 ${
              !overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
      style={{ height: 'calc(30vh - 20px)' }}
    >
      <div className='p-2 border-b border-white/10 flex justify-between items-center'>
        <span className='text-[10px] text-white/80'>Game Chat</span>
        {!isPaused ? (
          <span className='text-[10px] text-game-blue'>[Pause] to chat</span>
        ) : (
          <span className='text-[10px] text-game-green'>Chat Active</span>
        )}
      </div>

      <div className='flex-1 p-1 flex flex-col justify-end'>
        <div className='space-y-1'>
          {recentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`text-[10px] break-words ${
                msg.walletAddress === wallet.publicKey?.toString()
                  ? 'text-white'
                  : 'text-white/70'
              }`}
            >
              <span className='text-game-blue'>
                {shortenAddress(msg.walletAddress)}:
              </span>{' '}
              {msg.message}
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
  )
}

export default OverlayChat
