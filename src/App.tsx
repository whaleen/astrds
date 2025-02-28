// src/App.tsx
import React, { useMemo, useEffect, useState } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import GameLayout from './screens/game/components/GameLayout'
import GameStateManager from './screens/game/components/GameStateManager'
import ChatSystem from './components/chat/ChatSystem'
import OverlayManager from './components/overlay/OverlayManager'
import { useSettingsPanelStore } from './stores/settingsPanelStore'
import { useAudio } from './hooks/useAudio'
import { usePhantom } from './hooks/usePhantom'
import { Commitment } from '@solana/web3.js';
import Debugger from './components/Debugger';


interface LoadingOverlayProps {
  progress: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress }) => (
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

const App: React.FC = () => {
  usePhantom()
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress] = useState(0)


  const { volumes, setVolume, isInitialized } = useAudio();
  const toggleSettingsPanel = useSettingsPanelStore((state) => state.toggle);
  const endpoint = useMemo(() => import.meta.env.VITE_SOLANA_RPC_ENDPOINT, [])

  useEffect(() => {
    if (isInitialized) {
      setIsLoading(false)
    }
  }, [isInitialized])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          setVolume('master', volumes.master > 0 ? 0 : 0.5)
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          const volumeLevel = parseInt(e.key) / 5
          setVolume('master', volumeLevel)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [toggleSettingsPanel, setVolume])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({
        network: 'mainnet-beta',
      }),
    ],
    []
  )

  const config = {
    commitment: 'confirmed' as Commitment, // Cast to Commitment
    wsEndpoint: endpoint.replace('https', 'wss'),
    preflightCommitment: 'processed' as Commitment, // Cast to Commitment
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
                <OverlayManager />
                {/* <Debugger /> */}

              </>
            )}
          </GameLayout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
