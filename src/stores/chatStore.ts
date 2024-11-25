// src/stores/chatStore.ts
import { create } from 'zustand'
import { ChatStore, ChatMessage } from '@/types/chat'
import { postChatMessage, getChatMessages } from '@/api/chat'

const initialState = {
  messages: [],
  overlayVisible: false,
  chatMode: null,
  isPaused: false,
  error: null,
  isLoading: false,
}

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages.slice(-99), message],
    }))
  },

  toggleOverlay: () => {
    set((state) => ({
      overlayVisible: !state.overlayVisible,
      chatMode: state.chatMode === 'overlay' ? null : 'overlay',
    }))
  },

  toggleFullChat: () => {
    set((state) => ({
      chatMode: state.chatMode === 'full' ? null : 'full',
      overlayVisible: false,
    }))
  },

  closeChat: () => {
    set({
      chatMode: null,
      overlayVisible: false,
    })
  },

  setMode: (mode) => {
    set({ chatMode: mode })
  },

  togglePause: () => {
    set((state) => ({
      isPaused: !state.isPaused,
    }))
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  setMessages: (messages) => {
    set({ messages })
  },

  setError: (error) => {
    set({ error })
  },

  initializeChat: async () => {
    set({ isLoading: true })
    try {
      const messages = await getChatMessages()
      set({ messages, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error : new Error('Failed to load messages'),
        isLoading: false,
      })
    }
  },

  sendMessage: async (walletAddress: string, message: string) => {
    try {
      const response = await postChatMessage(walletAddress, message)
      get().addMessage(response)
      return true
    } catch (error) {
      set({
        error:
          error instanceof Error ? error : new Error('Failed to send message'),
      })
      return false
    }
  },
}))
