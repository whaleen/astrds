// src/stores/chatStore.js
import { create } from 'zustand'

export const useChatStore = create((set) => ({
  // State
  messages: [],
  overlayVisible: false,
  chatMode: null, // null, 'full', 'overlay'
  isPaused: false,

  // Actions
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message].slice(-100) // Keep last 100 messages
  })),

  toggleOverlay: () => set((state) => ({
    overlayVisible: !state.overlayVisible
  })),

  toggleFullChat: () => set((state) => ({
    chatMode: state.chatMode === 'full' ? null : 'full',
    overlayVisible: false
  })),

  closeChat: () => set({
    chatMode: null,
    overlayVisible: false
  }),

  setMode: (mode) => set({
    chatMode: mode
  }),

  togglePause: () => set((state) => ({
    isPaused: !state.isPaused
  })),

  clearMessages: () => set({
    messages: []
  }),

  // Method to initialize messages from server
  setMessages: (messages) => set({
    messages: messages
  })
}))
