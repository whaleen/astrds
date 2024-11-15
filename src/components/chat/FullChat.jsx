// src/components/chat/FullChat.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getChatMessages, postChatMessage } from '@/api/chat'
import { gameChannel } from '@/api/pusher'
import { useChatStore } from '@/stores/chatStore'

const shortenAddress = (address) => {
  if (!address || address === 'Anonymous') return 'Anonymous'
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const FullChat = ({ onClose, onPlayClick }) => {
  const wallet = useWallet()
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const pendingMessageRef = useRef(null)

  // Use chat store
  const { messages, addMessage } = useChatStore()

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

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

    if (distanceFromBottom < 100) {
      setShouldAutoScroll(true)
      setUnreadMessages(false)
    } else {
      setShouldAutoScroll(false)
    }
  }, [])

  const handleNewMessage = useCallback(
    (message) => {
      // No need to setMessages, the store handles this
      addMessage(message)

      if (message.walletAddress === wallet.publicKey?.toString()) {
        setShouldAutoScroll(true)
        scrollToBottom(true)
        return
      }

      const container = messagesContainerRef.current
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

        if (distanceFromBottom > 100) {
          setUnreadMessages(true)
        } else {
          scrollToBottom()
        }
      }
    },
    [wallet.publicKey, scrollToBottom, addMessage]
  )

  // Initial load of messages
  useEffect(() => {
    let mounted = true

    const loadInitialMessages = async () => {
      try {
        setError(null)
        await getChatMessages() // This updates the store directly
        if (mounted) {
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

    if (gameChannel) {
      gameChannel.bind('new-message', handleNewMessage)
    }

    return () => {
      mounted = false
      if (gameChannel) {
        gameChannel.unbind('new-message', handleNewMessage)
      }
    }
  }, [handleNewMessage, scrollToBottom])

  // Scroll handling
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

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

  const NewMessagesIndicator = () => {
    if (!unreadMessages || shouldAutoScroll) return null

    return (
      <button
        onClick={() => {
          setShouldAutoScroll(true)
          setUnreadMessages(false)
          scrollToBottom(true)
        }}
        className='absolute bottom-2 right-2 bg-game-blue text-black px-3 py-1 
                   rounded-full shadow-lg animate-bounce hover:bg-white 
                   transition-colors z-10 text-sm flex items-center gap-2'
      >
        <span className='w-2 h-2 bg-white rounded-full animate-pulse' />
        New Messages
      </button>
    )
  }

  useEffect(() => {
    setUnreadMessages(false)
  }, [])

  return (
    <div className='fixed inset-0 bg-black/75 flex items-center justify-center z-50'>
      <div className='bg-black border border-game-blue p-6 max-w-2xl w-full mx-4 h-[80vh] flex flex-col'>
        <button
          onClick={onClose}
          className='[&>.wallet-adapter-button]:bg-transparent
                  [&>.wallet-adapter-button]:border-2 
                  [&>.wallet-adapter-button]:border-game-blue 
                  [&>.wallet-adapter-button]:text-game-blue 
                  [&>.wallet-adapter-button]:font-arcade 
                  [&>.wallet-adapter-button]:px-6 
                  [&>.wallet-adapter-button]:py-3 
                  [&>.wallet-adapter-button]:text-sm 
                  [&>.wallet-adapter-button]:transition-all 
                  [&>.wallet-adapter-button]:duration-300
                  [&>.wallet-adapter-button:hover]:bg-game-blue 
                  [&>.wallet-adapter-button:hover]:text-black 
                  [&>.wallet-adapter-button:hover]:shadow-[0_0_10px_#4dc1f9]
                  [&>.wallet-adapter-button:not(:disabled):hover]:bg-game-blue'
        >
          ✕
        </button>

        <div className='flex justify-between items-center mb-4 mt-12'>
          <h2 className='text-xl text-game-blue'>Game Chat</h2>
        </div>

        <div className='flex-1 relative'>
          <div
            ref={messagesContainerRef}
            className='absolute inset-0 overflow-y-auto scrollbar-thin 
                       scrollbar-thumb-game-blue'
            style={{ paddingBottom: '0.5rem' }}
          >
            <div className='min-h-full flex flex-col justify-end'>
              <div className='space-y-4'>
                {loading ? (
                  <div className='text-center text-game-blue'>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className='text-center text-gray-500'>
                    No messages yet
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`space-y-1 px-2 ${
                        msg.walletAddress === wallet.publicKey?.toString()
                          ? 'opacity-100'
                          : 'opacity-80'
                      }`}
                    >
                      <div className='flex items-baseline gap-2'>
                        <span className='text-game-blue font-bold flex items-center gap-1'>
                          {shortenAddress(msg.walletAddress)}
                          <a
                            href={`https://solscan.io/account/${msg.walletAddress}`}
                            target='_blank'
                            title={`View ${msg.walletAddress} on Solscan`}
                            rel='noopener noreferrer'
                            className='text-gray-200 hover:text-white transition-colors text-3xl mb-5 ml-2 mr-4'
                          >
                            ⇗
                          </a>
                        </span>
                        <span className='text-xs text-gray-500'>
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className='text-white break-words'>{msg.message}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
          <NewMessagesIndicator />
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
              <span className='flex items-center gap-2'>
                <span className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin'></span>
              </span>
            ) : (
              'Send'
            )}
          </button>
        </form>

        {error && (
          <div className='mt-2 text-red-500 text-sm text-center'>{error}</div>
        )}
      </div>
    </div>
  )
}

export default FullChat
