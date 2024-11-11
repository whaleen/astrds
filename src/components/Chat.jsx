// src/components/Chat.jsx
import React, { useState, useEffect, useRef } from 'react'
import { getChatMessages, postChatMessage } from '../api/chat'
import { useWallet } from '@solana/wallet-adapter-react'

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const Chat = ({ onClose }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const wallet = useWallet()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getChatMessages()
      setMessages(data)
      setLoading(false)
      scrollToBottom()
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !wallet.connected) return

    try {
      const updatedMessages = await postChatMessage(
        wallet.publicKey.toString(),
        newMessage.trim()
      )
      setMessages(updatedMessages)
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const shortenAddress = (address) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className='fixed inset-0 bg-black/75 flex items-center justify-center z-50'>
      <div className='bg-black border border-game-blue p-6 max-w-2xl w-full mx-4 h-[80vh] flex flex-col'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl text-game-blue'>Game Chat</h2>
          <button
            onClick={onClose}
            className='text-game-blue hover:text-white transition-colors'
          >
            ✕
          </button>
        </div>

        <div className='flex-1 overflow-y-auto mb-4 space-y-4'>
          {loading ? (
            <div className='text-center text-game-blue'>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className='text-center text-gray-500'>No messages yet</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className='space-y-1'
              >
                <div className='flex items-baseline gap-2'>
                  <span className='text-game-blue font-bold'>
                    {shortenAddress(msg.walletAddress)}
                  </span>
                  <span className='text-xs text-gray-500'>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                <p className='text-white break-words'>{msg.message}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className='flex gap-2'
        >
          <input
            type='text'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              wallet.connected ? 'Type a message...' : 'Connect wallet to chat'
            }
            disabled={!wallet.connected}
            className='flex-1 bg-transparent border border-game-blue p-2 text-white 
                     placeholder:text-gray-500 focus:outline-none focus:border-white'
            maxLength={280}
          />
          <button
            type='submit'
            disabled={!wallet.connected || !newMessage.trim()}
            className='bg-game-blue text-black px-4 py-2 hover:bg-white 
                     transition-colors disabled:bg-gray-700 disabled:text-gray-500'
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat
