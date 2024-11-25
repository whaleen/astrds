// src/api/pusher.ts
import Pusher from 'pusher-js'
import { useChatStore } from '../stores/chatStore'

console.log('Initializing Pusher with:', {
  key: import.meta.env.VITE_PUSHER_KEY,
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
})

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  forceTLS: true,
})

const gameChannel = pusher.subscribe('game-chat')

// Add this after initializing gameChannel:
gameChannel.bind('new-message', (message) => {
  useChatStore.getState().addMessage(message)
})

// Add connection monitoring
pusher.connection.bind('connected', () => {
  console.log('Connected to Pusher')
})

pusher.connection.bind('error', (err) => {
  console.error('Pusher connection error:', err)
})

gameChannel.bind('pusher:subscription_succeeded', () => {
  console.log('Successfully subscribed to game-chat channel')
})

gameChannel.bind('pusher:subscription_error', (err) => {
  console.error('Error subscribing to game-chat channel:', err)
})

export { pusher, gameChannel }
