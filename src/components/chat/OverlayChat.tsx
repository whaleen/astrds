// src/components/chat/OverlayChat.tsx
import React, { useRef, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useChatStore } from '@/stores/chatStore'
import { ChatMessage } from '@/types/chat'
import { User } from 'lucide-react'

const MessageDisplay: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { publicKey } = useWallet()
  const isOwnMessage = message.walletAddress === publicKey?.toString()

  return (
    <div className={`text-[10px] break-words flex items-center gap-2 
      ${isOwnMessage ? 'text-white' : 'text-white/70'}`}
    >
      <div className='w-4 h-4 rounded-full flex items-center justify-center'>
        <User className='w-3 h-3 text-game-blue' />
      </div>
      <div>
        <span className='text-game-blue'>
          {message.walletAddress.slice(0, 4)}...{message.walletAddress.slice(-4)}:
        </span>{' '}
        {message.message}
      </div>
    </div>
  )
}

const OverlayChat: React.FC = () => {
  const { messages, isPaused, sendMessage } = useChatStore() // Now properly typed
  const { connected, publicKey } = useWallet()
  const [newMessage, setNewMessage] = React.useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !connected || !publicKey) return

    try {
      const success = await sendMessage(publicKey.toString(), newMessage.trim())
      if (success) {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className='fixed right-4 top-20 w-64 rounded-xs flex flex-col z-20
                    transition-all duration-300'>
      {/* Backdrop layer */}
      <div className='absolute inset-0 bg-black/30 backdrop-blur-sm 
                    border border-white/10 rounded-xs' />

      {/* Content layer */}
      <div className='relative flex flex-col h-[calc(90vh-5rem)]'>
        <div className='p-2 border-b border-white/10 flex justify-between items-center'>
          <span className='text-[10px] text-white'>Game Chat [C] to toggle</span>
          {!isPaused ? (
            <span className='text-[10px] text-game-blue'>[Pause] to chat</span>
          ) : (
            <span className='text-[10px] text-game-green'>Chat Active</span>
          )}
        </div>

        <div className='flex-1 p-4 flex flex-col justify-end overflow-y-auto'>
          <div className='space-y-1'>
            {messages.slice(-20).map((msg) => (
              <MessageDisplay key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {isPaused && (
          <form onSubmit={handleSubmit} className='p-1 border-t border-white/10'>
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
                disabled={!connected}
              />
              <button
                type='submit'
                disabled={!newMessage.trim() || !connected}
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
