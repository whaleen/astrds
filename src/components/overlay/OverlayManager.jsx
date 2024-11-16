// src/components/overlay/OverlayManager.jsx
import React, { useEffect } from 'react'
import { create } from 'zustand'
import SoundSettings from '../sound/SoundSettings'
import AccountScreen from '@/screens/account/AccountScreen'
import FullChat from '@/components/chat/FullChat'
import LeaderboardScreen from '@/screens/leaderboard/LeaderboardScreen'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsPanelStore } from '@/stores/settingsPanelStore'
import { useEngineStore } from '@/stores/engineStore'

export const OVERLAY_TYPES = {
  NONE: null,
  SOUND: 'sound',
  ACCOUNT: 'account',
  CHAT: 'chat',
  LEADERBOARD: 'leaderboard',
}

// Determine which overlays should blur the background and pause the game
const OVERLAY_BEHAVIOR = {
  [OVERLAY_TYPES.SOUND]: { blur: true, shouldPause: true },
  [OVERLAY_TYPES.ACCOUNT]: { blur: true, shouldPause: true },
  [OVERLAY_TYPES.CHAT]: { blur: true, shouldPause: true },
  [OVERLAY_TYPES.LEADERBOARD]: { blur: false, shouldPause: false }, // Leaderboard doesn't pause or blur
}

export const useOverlayStore = create((set, get) => ({
  activeOverlay: OVERLAY_TYPES.NONE,
  wasGamePaused: false,

  openOverlay: (overlay) => {
    console.log('🔵 Opening overlay:', overlay)
    const currentOverlay = get().activeOverlay
    const gameState = useGameStore.getState()
    const engineState = useEngineStore.getState()
    const settingsPanel = useSettingsPanelStore.getState()
    const overlayBehavior = OVERLAY_BEHAVIOR[overlay]

    if (currentOverlay === overlay) {
      console.log('🔄 Closing same overlay')
      get().closeOverlay()
      return
    }

    if (overlay === OVERLAY_TYPES.SOUND) {
      settingsPanel.toggle()
    }

    if (gameState.gameState === 'PLAYING' && overlayBehavior?.shouldPause) {
      if (!gameState.isPaused) {
        gameState.setPause(true)
        engineState.togglePause(true)
        set({ wasGamePaused: true })
      }
    }

    set({ activeOverlay: overlay })
  },

  closeOverlay: () => {
    console.log('🔴 Closing overlay')
    const { wasGamePaused, activeOverlay } = get()
    const gameState = useGameStore.getState()
    const engineState = useEngineStore.getState()
    const settingsPanel = useSettingsPanelStore.getState()

    if (activeOverlay === OVERLAY_TYPES.SOUND) {
      settingsPanel.close()
    }

    if (wasGamePaused && gameState.gameState === 'PLAYING') {
      gameState.setPause(false)
      engineState.togglePause(false)
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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        console.log('⌨️ Key press ignored (input/textarea focused)')
        return
      }

      console.log('⌨️ Key pressed:', e.key.toLowerCase())
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
    console.log('🎮 Play button clicked')
    closeOverlay()
    setGameState('READY_TO_PLAY')
  }

  // Wrapper component that adds conditional backdrop
  const OverlayWrapper = ({ children, type }) => {
    console.log('🎭 Rendering overlay wrapper for type:', type)
    if (!children) return null

    const { blur } = OVERLAY_BEHAVIOR[type] || {}

    return (
      <div
        className={`fixed inset-0 z-50 
        ${blur ? 'bg-black/75 backdrop-blur-sm' : ''}`}
      >
        {children}
      </div>
    )
  }

  // Render active overlay with consistent backdrop handling
  const renderActiveOverlay = () => {
    console.log('🎨 Rendering overlay:', activeOverlay)
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
