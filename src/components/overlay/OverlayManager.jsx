// src/components/overlay/OverlayManager.jsx
import React, { useEffect } from 'react'
import { create } from 'zustand'
import SoundSettings from '../sound/SoundSettings'
import AccountScreen from '@/screens/account/AccountScreen'
import FullChat from '@/components/chat/FullChat'
import LeaderboardScreen from '@/screens/leaderboard/LeaderboardScreen'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsPanelStore } from '@/stores/settingsPanelStore'

export const OVERLAY_TYPES = {
  NONE: null,
  SOUND: 'sound',
  ACCOUNT: 'account',
  CHAT: 'chat',
  LEADERBOARD: 'leaderboard',
}

// Determine which overlays should blur the background
const BLUR_BACKDROP = {
  [OVERLAY_TYPES.SOUND]: true,
  [OVERLAY_TYPES.ACCOUNT]: true,
  [OVERLAY_TYPES.CHAT]: true,
  [OVERLAY_TYPES.LEADERBOARD]: false, // No blur for leaderboard
}

export const useOverlayStore = create((set, get) => ({
  activeOverlay: OVERLAY_TYPES.NONE,
  wasGamePaused: false,

  openOverlay: (overlay) => {
    const gameState = useGameStore.getState()
    const currentOverlay = get().activeOverlay
    const settingsPanel = useSettingsPanelStore.getState()

    if (currentOverlay === overlay) {
      get().closeOverlay()
      return
    }

    // Special handling for sound settings
    if (overlay === OVERLAY_TYPES.SOUND) {
      settingsPanel.toggle()
      set({ activeOverlay: overlay })
      return
    }

    if (gameState.gameState === 'PLAYING' && !gameState.isPaused) {
      gameState.setPause(true)
      set({ wasGamePaused: true })
    }

    set({ activeOverlay: overlay })
  },

  closeOverlay: () => {
    const { wasGamePaused, activeOverlay } = get()
    const gameState = useGameStore.getState()
    const settingsPanel = useSettingsPanelStore.getState()

    // Special handling for sound settings
    if (activeOverlay === OVERLAY_TYPES.SOUND) {
      settingsPanel.close()
    }

    if (wasGamePaused && gameState.gameState === 'PLAYING') {
      gameState.setPause(false)
    }

    set({
      activeOverlay: OVERLAY_TYPES.NONE,
      wasGamePaused: false,
    })
  },

  isOverlayActive: (overlay) => get().activeOverlay === overlay,
}))

const OverlayManager = () => {
  const { activeOverlay, openOverlay, closeOverlay } = useOverlayStore()
  const setGameState = useGameStore((state) => state.setGameState)

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')
        return

      switch (e.key.toLowerCase()) {
        case 's':
          openOverlay(OVERLAY_TYPES.SOUND)
          break
        case 'f':
          openOverlay(OVERLAY_TYPES.CHAT)
          break
        case 'l':
          openOverlay(OVERLAY_TYPES.LEADERBOARD)
          break
        case 'a':
          openOverlay(OVERLAY_TYPES.ACCOUNT)
          break
        case 'escape':
          if (activeOverlay) {
            closeOverlay()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [activeOverlay, openOverlay, closeOverlay])

  const handlePlayClick = () => {
    closeOverlay()
    setGameState('READY_TO_PLAY')
  }

  // Wrapper component that adds conditional backdrop
  const OverlayWrapper = ({ children, type }) => {
    if (!children) return null

    return (
      <div
        className={`fixed inset-0 z-50 
        ${BLUR_BACKDROP[type] ? 'bg-black/75 backdrop-blur-sm' : ''}`}
      >
        {children}
      </div>
    )
  }

  // Render active overlay with consistent backdrop handling
  const renderActiveOverlay = () => {
    switch (activeOverlay) {
      case OVERLAY_TYPES.SOUND:
        return (
          <OverlayWrapper type={OVERLAY_TYPES.SOUND}>
            <SoundSettings
              isOpen={true}
              onClose={closeOverlay}
            />
          </OverlayWrapper>
        )
      case OVERLAY_TYPES.ACCOUNT:
        return (
          <OverlayWrapper type={OVERLAY_TYPES.ACCOUNT}>
            <AccountScreen onClose={closeOverlay} />
          </OverlayWrapper>
        )
      case OVERLAY_TYPES.CHAT:
        return (
          <OverlayWrapper type={OVERLAY_TYPES.CHAT}>
            <FullChat
              onClose={closeOverlay}
              onPlayClick={handlePlayClick}
            />
          </OverlayWrapper>
        )
      case OVERLAY_TYPES.LEADERBOARD:
        return (
          <OverlayWrapper type={OVERLAY_TYPES.LEADERBOARD}>
            <LeaderboardScreen
              isOverlay={true}
              onClose={closeOverlay}
              onPlayAgain={handlePlayClick}
            />
          </OverlayWrapper>
        )
      default:
        return null
    }
  }

  return renderActiveOverlay()
}

export default OverlayManager
