// src/api/chat.ts
import { useChatStore } from '../stores/chatStore'

export const getChatMessages = async () => {
  console.log('Fetching chat messages...')
  try {
    const response = await fetch('/api/getChatMessages')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    // Update store with fetched messages
    useChatStore.getState().setMessages(Array.isArray(data) ? data : [])
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return []
  }
}

export const postChatMessage = async (walletAddress, message) => {
  console.log('Posting message:', { walletAddress, message })
  try {
    const response = await fetch('/api/postChatMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress, message }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    // Add message to store
    useChatStore.getState().addMessage(data.message)
    return data.message
  } catch (error) {
    console.error('Error posting chat message:', error)
    throw error
  }
}
