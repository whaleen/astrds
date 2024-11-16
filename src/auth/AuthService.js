// src/services/auth/AuthService.js
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token'

const RECIPIENT_WALLET = new PublicKey('AMKzF4Phzhp8htd9xerLSm1aderQT7t2v35HzbhDAjvE')
const TOKEN_MINT = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP')
const SOL_COST = 0.05
const TOKEN_COST = 1000

class AuthService {
  constructor() {
    this.verifiedSessions = new Set()
    this.connection = new Connection(import.meta.env.VITE_SOLANA_RPC_ENDPOINT)
  }

  async autoConnectWallet() {
    try {
      const { solana } = window
      if (!solana?.isPhantom) {
        throw new Error('Phantom wallet not found')
      }

      try {
        const response = await solana.connect({ onlyIfTrusted: true })
        return response.publicKey
      } catch (err) {
        return null
      }
    } catch (error) {
      console.error('Auto-connect error:', error)
      return null
    }
  }

  async verifyWalletSignature(wallet) {
    if (!wallet.publicKey) throw new Error('No wallet connected')

    const sessionKey = wallet.publicKey.toString()
    if (this.verifiedSessions.has(sessionKey)) {
      return true
    }

    try {
      // Ensure proper connection
      if (!wallet.connected) {
        try {
          await wallet.connect()
        } catch (err) {
          console.log('Wallet already connected or connection declined')
        }
      }

      // Check balances
      const [solBalance, tokenBalance] = await Promise.all([
        this.connection.getBalance(wallet.publicKey),
        this.getTokenBalance(wallet.publicKey)
      ])

      const hasSufficientSol = solBalance >= SOL_COST * 1e9
      const hasSufficientTokens = tokenBalance >= TOKEN_COST

      if (!hasSufficientSol && !hasSufficientTokens) {
        throw new Error('Insufficient balance for SOL or ASTRDS')
      }

      // Create and prepare transaction
      const transaction = new Transaction()

      if (hasSufficientSol) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: RECIPIENT_WALLET,
            lamports: SOL_COST * 1e9
          })
        )
      } else {
        const fromTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey)
        const toTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, RECIPIENT_WALLET)

        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            wallet.publicKey,
            TOKEN_COST
          )
        )
      }

      // Get recent blockhash and set fee payer
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = wallet.publicKey

      // Sign and send with proper error handling
      try {
        const signedTx = await wallet.signTransaction(transaction)
        const signature = await this.connection.sendRawTransaction(signedTx.serialize())

        // Wait for confirmation
        const confirmation = await this.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        })

        if (confirmation.value.err) {
          throw new Error('Transaction failed to confirm')
        }

        this.verifiedSessions.add(sessionKey)
        return true
      } catch (err) {
        console.error('Transaction signing failed:', err)
        throw new Error('Failed to sign transaction')
      }

    } catch (error) {
      console.error('Verification failed:', error)
      throw error
    }
  }

  async createPaymentTransaction(walletPubkey, paymentType) {
    const transaction = new Transaction()

    if (paymentType === 'SOL') {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPubkey,
          toPubkey: RECIPIENT_WALLET,
          lamports: SOL_COST * 1e9
        })
      )
    } else {
      const fromTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, walletPubkey)
      const toTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, RECIPIENT_WALLET)

      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          walletPubkey,
          TOKEN_COST
        )
      )
    }

    return transaction
  }

  async getTokenBalance(walletPubkey) {
    try {
      const tokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, walletPubkey)
      const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount)
      return accountInfo.value.uiAmount
    } catch {
      return 0
    }
  }

  clearSession(walletPubkey) {
    this.verifiedSessions.delete(walletPubkey.toString())
  }
}

export const authService = new AuthService()
