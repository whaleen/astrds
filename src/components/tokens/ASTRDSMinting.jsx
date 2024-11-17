import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const ASTRDSMinting = ({ tokenCount }) => {
  const { publicKey } = useWallet()
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
    signature: null,
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
      setStatus({ loading: true, error: null, success: false, signature: null })
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

      console.log('Mint transaction successful:', result.serializedTransaction)

      setStatus({
        loading: false,
        error: null,
        success: true,
        signature: result.serializedTransaction,
      })
    } catch (error) {
      console.error('Minting failed:', error)
      setStatus({
        loading: false,
        error: error.message || 'Failed to mint tokens',
        success: false,
        signature: null,
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
          ${
            status.loading || status.success
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
