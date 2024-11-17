// src/components/tokens/ASTRDSMinting.jsx
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const ASTRDSMinting = ({ tokenCount }) => {
  const wallet = useWallet()
  const [mintingTokens, setMintingTokens] = useState(false)
  const [mintError, setMintError] = useState(null)

  const mintGameTokens = async () => {
    if (!wallet.connected || tokenCount === 0) return

    try {
      setMintingTokens(true)
      setMintError(null)

      const response = await fetch('/.netlify/functions/mintTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerPublicKey: wallet.publicKey.toBase58(),
          tokenCount,
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      console.log('Minted tokens! Transaction:', result.txSignature)
    } catch (error) {
      console.error('Failed to mint tokens:', error)
      setMintError('Failed to mint tokens. Please try again.')
    } finally {
      setMintingTokens(false)
    }
  }

  if (tokenCount === 0) return null

  return (
    <div className='mb-8'>
      <div className='text-lg mb-2'>Tokens Collected</div>
      <div className='text-2xl text-game-blue font-bold'>
        {tokenCount.toLocaleString()} ASTRDS
      </div>
      <button
        onClick={mintGameTokens}
        disabled={mintingTokens || !wallet.connected}
        className={`mt-4 px-4 py-2 bg-game-blue text-black
          ${
            mintingTokens ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
          }`}
      >
        {!wallet.connected
          ? 'Connect Wallet to Claim'
          : mintingTokens
          ? 'Minting...'
          : 'Claim Tokens'}
      </button>
      {mintError && (
        <div className='text-red-500 text-sm mt-2'>{mintError}</div>
      )}
    </div>
  )
}

export default ASTRDSMinting
