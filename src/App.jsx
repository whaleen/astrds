// src/App.jsx
import React, { useMemo, useEffect, useState } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import GameLayout from './components/layout/GameLayout'
import GameStateManager from './components/game/GameStateManager'
import ChatSystem from './components/chat/ChatSystem'
import SoundSettings from './components/ui/sound/SoundSettings'
import { useAudioStore } from './stores/audioStore'
import { soundManager } from './sounds/SoundManager'

// Loading overlay component
const LoadingOverlay = ({ progress }) => (
  <div className='fixed inset-0 bg-black flex items-center justify-center z-50'>
    <div className='text-center'>
      <h2 className='text-xl text-game-blue mb-4'>Loading Game Assets</h2>
      <div className='w-64 h-2 bg-white/10 rounded-full overflow-hidden'>
        <div
          className='h-full bg-game-blue transition-all duration-300'
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className='mt-2 text-sm text-white/50'>
        Loading sounds... {Math.round(progress)}%
      </div>
    </div>
  </div>
)

const App = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  const {
    setMasterVolume,
    toggleMute,
    toggleSettingsPanel,
    initializeSettings,
  } = useAudioStore()

  const endpoint = useMemo(() => import.meta.env.VITE_SOLANA_RPC_ENDPOINT, [])

  // Initialize sound system
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Load saved settings first
        initializeSettings()

        // Initialize sound manager with progress updates
        await soundManager.init((progress) => {
          setLoadingProgress(progress)
        })

        // Short delay to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 500))

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize audio:', error)
        // Even if there's an error, we should still show the game
        setIsLoading(false)
      }
    }

    initializeAudio()
  }, [initializeSettings])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      switch (e.key.toLowerCase()) {
        case 's':
          toggleSettingsPanel()
          break
        case 'm':
          toggleMute()
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          const volumeLevel = parseInt(e.key) / 5
          setMasterVolume(volumeLevel)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [toggleMute, setMasterVolume, toggleSettingsPanel])

  // Wallet configuration
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({
        network: 'mainnet-beta',
      }),
    ],
    []
  )

  const config = {
    commitment: 'confirmed',
    wsEndpoint: endpoint.replace('https', 'wss'),
    preflightCommitment: 'processed',
    confirmTransactionInitialTimeout: 60000,
  }

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={config}
    >
      <WalletProvider
        wallets={wallets}
        autoConnect
      >
        <WalletModalProvider>
          <GameLayout>
            {isLoading ? (
              <LoadingOverlay progress={loadingProgress} />
            ) : (
              <>
                <GameStateManager />
                <ChatSystem />
                <SoundSettings />
              </>
            )}
          </GameLayout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
