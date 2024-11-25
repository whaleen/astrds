// src/components/chat/ChatBase.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { gameChannel } from '@/api/pusher'
import { getChatMessages, postChatMessage } from '@/api/chat'

const shortenAddress = (address) => {
  if (!address || address === 'Anonymous') return 'Anonymous'
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export const useChatLogic = () => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState(null)
  const [unreadMessages, setUnreadMessages] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const pendingMessageRef = useRef(null)
  const wallet = useWallet()

  // Scroll logic
  const scrollToBottom = useCallback(
    (force = false) => {
      if (messagesEndRef.current && (shouldAutoScroll || force)) {
        messagesEndRef.current.scrollIntoView({
          behavior: force ? 'auto' : 'smooth',
        })
      }
    },
    [shouldAutoScroll]
  )

  // Message handling
  const handleNewMessage = useCallback(
    (message) => {
      setMessages((prev) => {
        const newMessages = [...prev, message].slice(-100)
        return Array.from(
          new Map(newMessages.map((msg) => [msg.id, msg])).values()
        )
      })

      const container = messagesContainerRef.current
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

        if (message.walletAddress === wallet.publicKey?.toString()) {
          setShouldAutoScroll(true)
          scrollToBottom(true)
        } else if (distanceFromBottom > 100) {
          setUnreadMessages(true)
        } else {
          scrollToBottom()
        }
      }
    },
    [wallet.publicKey, scrollToBottom]
  )

  // Initialize chat
  useEffect(() => {
    let mounted = true

    const loadInitialMessages = async () => {
      try {
        setError(null)
        const data = await getChatMessages()
        if (mounted) {
          setMessages(data)
          setLoading(false)
          scrollToBottom(true)
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
        if (mounted) {
          setError('Failed to load messages. Please try again later.')
          setLoading(false)
        }
      }
    }

    loadInitialMessages()
    gameChannel?.bind('new-message', handleNewMessage)

    return () => {
      mounted = false
      gameChannel?.unbind('new-message', handleNewMessage)
    }
  }, [handleNewMessage, scrollToBottom])

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !wallet.connected || sendingMessage) return

    const messageText = newMessage.trim()
    const tempId = Date.now().toString()
    pendingMessageRef.current = tempId

    setNewMessage('')
    setSendingMessage(true)
    setShouldAutoScroll(true)

    try {
      await postChatMessage(wallet.publicKey.toString(), messageText)
      setSendingMessage(false)
      pendingMessageRef.current = null
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message. Please try again.')
      setNewMessage(messageText)
      setSendingMessage(false)
      pendingMessageRef.current = null
    }
  }

  return {
    messages,
    newMessage,
    loading,
    sendingMessage,
    error,
    unreadMessages,
    shouldAutoScroll,
    messagesEndRef,
    messagesContainerRef,
    setNewMessage,
    setShouldAutoScroll,
    setUnreadMessages,
    handleSubmit,
    scrollToBottom,
  }
}

// Common message components
export const MessagesList = ({
  messages,
  messagesContainerRef,
  messagesEndRef,
}) => (
  <div className='space-y-4'>
    {messages.map((msg) => (
      <Message
        key={msg.id}
        message={msg}
      />
    ))}
    <div ref={messagesEndRef} />
  </div>
)

export const Message = ({ message }) => {
  const wallet = useWallet()
  const isOwnMessage = message.walletAddress === wallet.publicKey?.toString()

  return (
    <div
      className={`space-y-1 px-2 ${isOwnMessage ? 'opacity-100' : 'opacity-80'
        }`}
    >
      <div className='flex items-baseline gap-2'>
        <span className='text-game-blue font-bold flex items-center gap-1'>
          {shortenAddress(message.walletAddress)}
          <a
            href={`https://solscan.io/account/${message.walletAddress}`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-gray-200 hover:text-white transition-colors text-3xl mb-5 ml-2 mr-4'
          >
            ⇗
          </a>
        </span>
        <span className='text-xs text-gray-500'>
          {new Date(message.timestamp).toLocaleString()}
        </span>
      </div>
      <p className='text-white break-words'>{message.message}</p>
    </div>
  )
}

export const ChatInput = ({
  newMessage,
  setNewMessage,
  handleSubmit,
  sendingMessage,
  wallet,
}) => (
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
      disabled={!wallet.connected || sendingMessage}
      className='flex-1 bg-transparent border border-game-blue p-2 text-white 
                 placeholder:text-gray-500 focus:outline-none focus:border-white
                 disabled:opacity-50 disabled:cursor-not-allowed'
      maxLength={280}
    />
    <button
      type='submit'
      disabled={!wallet.connected || !newMessage.trim() || sendingMessage}
      className='bg-game-blue text-black px-4 py-2 hover:bg-white 
                 transition-colors disabled:bg-gray-700 disabled:text-gray-500
                 min-w-[80px] flex items-center justify-center'
    >
      {sendingMessage ? (
        <span className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin' />
      ) : (
        'Send'
      )}
    </button>
  </form>
)
