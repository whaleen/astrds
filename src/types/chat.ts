// src/types/chat.ts

export interface ChatMessage {
  id: string
  walletAddress: string
  message: string
  timestamp: string
}

export interface ChatState {
  messages: ChatMessage[]
  overlayVisible: boolean
  chatMode: 'full' | 'overlay' | null
  isPaused: boolean
  error: Error | null
  isLoading: boolean
}

export interface ChatActions {
  addMessage: (message: ChatMessage) => void
  toggleOverlay: () => void
  toggleFullChat: () => void
  closeChat: () => void
  setMode: (mode: ChatState['chatMode']) => void
  togglePause: () => void
  clearMessages: () => void
  setMessages: (messages: ChatMessage[]) => void
  setError: (error: Error | null) => void
  // Add these new actions
  sendMessage: (walletAddress: string, message: string) => Promise<boolean>
  initializeChat: () => Promise<void>
}

export type ChatStore = ChatState & ChatActions

export interface ChatProps {
  isOverlay?: boolean
  onClose?: () => void
  onPlayClick?: () => void // Make optional
}

export interface ChatMessageProps {
  message: ChatMessage
  isOwnMessage: boolean
}

export interface ChatInputProps {
  onSubmit: (message: string) => void
  disabled?: boolean
  loading?: boolean
}
