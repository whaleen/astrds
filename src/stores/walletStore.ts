// src/stores/walletStore.ts

import { create } from 'zustand'
import { WalletStore } from '@/types/wallet'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { getTokenBalances } from '@/utils/tokenBalances'

const RPC_ENDPOINT = import.meta.env.VITE_SOLANA_RPC_ENDPOINT

export const useWalletStore = create<WalletStore>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  publicKey: null,
  error: null,
  balance: {
    SOL: 0,
    ASTRDS: 0,
  },
  network: WalletAdapterNetwork.Mainnet,
  lastTransaction: null,

  connect: async () => {
    if (!window.solana) {
      set({
        error: new Error('Phantom wallet is not installed'),
      })
      return
    }

    set({ isConnecting: true, error: null })

    try {
      const response = await window.solana.connect()
      const publicKey = new PublicKey(response.publicKey.toString())

      set({
        isConnected: true,
        isConnecting: false,
        publicKey,
      })

      // Fetch initial balances
      await get().refreshBalance()
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error
            : new Error('Failed to connect wallet'),
        isConnecting: false,
        isConnected: false,
      })
    }
  },

  disconnect: async () => {
    if (!window.solana) return

    try {
      await window.solana.disconnect()
      set({
        isConnected: false,
        publicKey: null,
        balance: {
          SOL: 0,
          ASTRDS: 0,
        },
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error
            : new Error('Failed to disconnect wallet'),
      })
    }
  },

  sendTransaction: async (transaction: Transaction) => {
    if (!window.solana || !get().publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      const connection = new Connection(RPC_ENDPOINT, 'confirmed')
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = get().publicKey

      const signed = await window.solana.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction(signature)

      set({ lastTransaction: signature })
      await get().refreshBalance()

      return signature
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Transaction failed'),
      })
      throw error
    }
  },

  refreshBalance: async () => {
    const publicKey = get().publicKey
    if (!publicKey) return

    try {
      const balances = await getTokenBalances(publicKey.toString(), [
        process.env.ASTRDS_TOKEN_ADDRESS!,
      ])

      set({
        balance: {
          SOL: balances.SOL,
          ASTRDS: balances[process.env.ASTRDS_TOKEN_ADDRESS!] || 0,
        },
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error
            : new Error('Failed to fetch balances'),
      })
    }
  },

  setNetwork: (network) => {
    set({ network })
  },

  clearError: () => {
    set({ error: null })
  },
}))
