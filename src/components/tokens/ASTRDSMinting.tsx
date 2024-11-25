// src/compoments/tokens/ASTRDSMinting.tsx
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameData } from '@/stores/gameData'

const ASTRDSMinting: React.FC<{ tokenCount: number }> = ({ tokenCount }) => {
  const { publicKey } = useWallet()
  const verifyTokensForMinting = useGameData((state) => state.verifyTokensForMinting)
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    signature: null,
    success: false
  })

  const mintGameTokens = async () => {
    if (!publicKey || tokenCount <= 0) return

    try {
      setStatus({ loading: true, error: null, signature: null, success: false })

      // Verify tokens before minting
      const verified = await verifyTokensForMinting()
      if (!verified) {
        throw new Error('Token verification failed - possible client/server mismatch')
      }

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
        signature: result.signature,
        success: true
      })

    } catch (error) {
      console.error('Minting failed:', error)
      setStatus({
        loading: false,
        error: error.message || 'Failed to mint tokens',
        signature: null,
        success: false
      })
    }
  }


  if (tokenCount <= 0) {
    return null
  }

  return (
    <div className='mb-8'>
      <div className='text-lg mb-4'>Collected Tokens: {tokenCount}</div>

      <button
        onClick={mintGameTokens}
        disabled={status.loading || !publicKey || status.success}
        className={`mt-4 px-4 py-2 bg-game-blue text-black
          ${status.loading || status.success
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-white'
          }`}
      >
        {!publicKey
          ? 'Connect Wallet to Claim'
          : status.loading
            ? 'Minting...'
            : status.success
              ? 'Tokens Claimed!'
              : `Claim ${tokenCount} Tokens`}
      </button>

      {status.error && (
        <div className='text-red-500 text-sm mt-2'>Error: {status.error}</div>
      )}

      {status.success && (
        <div className='text-green-500 text-sm mt-2'>
          <div>Tokens successfully minted!</div>
          <a
            href={`https://explorer.solana.com/tx/${status.signature}?cluster=devnet`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 hover:underline'
          >
            View on Solana Explorer
          </a>
        </div>
      )}
    </div>
  )
}

export default ASTRDSMinting
