// src/components/tokens/ASTRDSMinting.tsx
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameData } from '@/stores/gameData'

const ASTRDSMinting: React.FC<{ tokenCount: number }> = ({ tokenCount }) => {
  const { publicKey } = useWallet()
  const verifyTokensForMinting = useGameData((state) => state.verifyTokensForMinting)
  const [status, setStatus] = useState({
    loading: false,
    error: null as string | null,
    signature: null as string | null,
  })

  const mintGameTokens = async () => {
    if (!publicKey || tokenCount <= 0) {
      console.warn('Invalid mint attempt:', {
        publicKey: publicKey?.toString(),
        tokenCount,
      })
      return
    }

    try {
      setStatus({ loading: true, error: null, signature: null })

      // Verify token amounts against session record
      console.log('Verifying token amounts...')
      const verified = await verifyTokensForMinting()
      if (!verified) {
        throw new Error('Token verification failed - amounts do not match server record')
      }
      console.log('Token verification successful')

      console.log('Initiating mint for player:', publicKey.toString())
      const response = await fetch('/.netlify/functions/mintTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerPublicKey: publicKey.toString(),
          tokenCount: Number(tokenCount),
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Minting failed')
      }

      setStatus({
        loading: false,
        error: null,
        signature: result.serializedTransaction,
      })

      console.log('Mint transaction successful:', result.serializedTransaction)

    } catch (error) {
      console.error('Minting failed:', error)
      setStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to mint tokens',
        signature: null,
      })
    }
  }

  // Early return if no tokens to claim
  if (tokenCount <= 0) {
    return null
  }

  return (
    <div className='mb-8 space-y-4'>
      <div className='text-lg mb-4'>
        <span className='text-game-blue'>Collected Tokens:</span> {tokenCount}
      </div>

      <button
        onClick={mintGameTokens}
        disabled={status.loading || !publicKey || status.signature !== null}
        className={`w-full px-4 py-2 bg-game-blue text-black
          ${status.loading || !publicKey || status.signature
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-white'
          }`}
      >
        {!publicKey
          ? 'Connect Wallet to Claim'
          : status.loading
            ? 'Verifying and Minting...'
            : status.signature
              ? 'Tokens Claimed!'
              : `Claim ${tokenCount} ASTRDS`}
      </button>

      {status.error && (
        <div className='text-red-500 text-sm bg-red-500/10 p-3 rounded border border-red-500/20'>
          {status.error}
        </div>
      )}

      {status.signature && (
        <div className='text-green-500 text-sm bg-green-500/10 p-3 rounded border border-green-500/20'>
          <div className='mb-2'>Tokens successfully minted!</div>
          <a
            href={`https://explorer.solana.com/tx/${status.signature}?cluster=devnet`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 hover:underline inline-flex items-center gap-1'
          >
            View on Solana Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}

export default ASTRDSMinting
