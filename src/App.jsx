// src/App.jsx
import React, { useMemo } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import GameLayout from './components/layout/GameLayout'
import GameStateManager from './components/game/GameStateManager'
import ChatSystem from './components/chat/ChatSystem'
import { GameProvider } from './context/GameProvider'

const App = () => {
  // Use Helius RPC URL from environment variables
  const endpoint = useMemo(() => import.meta.env.VITE_SOLANA_RPC_ENDPOINT, [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({
        network: 'mainnet-beta', // Changed to mainnet
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
          <GameProvider>
            <GameLayout>
              <GameStateManager />
              <ChatSystem />
            </GameLayout>
          </GameProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
