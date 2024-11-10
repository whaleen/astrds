import React from 'react'
import { createRoot } from 'react-dom/client'
import { SolanaAsteroidsWrapper } from './SolanaAsteroids'
import './styles/style.css'

// Wallet imports
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

// Import wallet styles
import '@solana/wallet-adapter-react-ui/styles.css'

const container = document.getElementById('root')
const root = createRoot(container)

// Initialize wallet adapter with more explicit configuration
const endpoint = clusterApiUrl('devnet')
const config = {
  commitment: 'confirmed',
}

const wallets = [new PhantomWalletAdapter()]

// Render app with more detailed configuration
root.render(
  <React.StrictMode>
    <ConnectionProvider
      endpoint={endpoint}
      config={config}
    >
      <WalletProvider
        wallets={wallets}
        autoConnect
      >
        <WalletModalProvider>
          <SolanaAsteroidsWrapper />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
)
