// src/components/tokens/ASTRDSMinting.jsx
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, Transaction, PublicKey } from '@solana/web3.js'

const ASTRDSMinting = ({ tokenCount }) => {
  const wallet = useWallet()
  const [mintingTokens, setMintingTokens] = useState(false)
  const [mintError, setMintError] = useState(null)
  const [mintSuccess, setMintSuccess] = useState(false)

  const mintGameTokens = async () => {
    if (!wallet.connected || tokenCount === 0) return

    try {
      setMintingTokens(true)
      setMintError(null)
      setMintSuccess(false)

      // Get partially signed transaction from backend
      const response = await fetch('/.netlify/functions/mintTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerPublicKey: wallet.publicKey.toBase58(),
          tokenCount: Number(tokenCount),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to build transaction')
      }

      const { serializedTransaction } = await response.json()

      // Deserialize the transaction
      const transaction = Transaction.from(
        Buffer.from(serializedTransaction, 'base64')
      )

      // Connect to Solana
      const connection = new Connection(
        'https://api.devnet.solana.com',
        'confirmed'
      )

      // Sign with the player's wallet
      const signedTx = await wallet.signTransaction(transaction)

      // Send the fully signed transaction
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      )
      console.log('Transaction sent:', signature)

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(
        signature,
        'confirmed'
      )

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        )
      }

      console.log('Transaction confirmed:', signature)
      setMintSuccess(true)
    } catch (error) {
      console.error('Minting error:', error)
      setMintError(error.message || 'Failed to mint tokens. Please try again.')
    } finally {
      setMintingTokens(false)
    }
  }

  if (tokenCount === 0) return null

  return (
    <div className='mb-8'>
      <div className='text-lg mb-2'>Tokens Collected</div>
      <div className='text-2xl text-game-blue font-bold'>
        {Number(tokenCount).toLocaleString()} ASTRDS
      </div>

      <button
        onClick={mintGameTokens}
        disabled={mintingTokens || !wallet.connected || mintSuccess}
        className={`mt-4 px-4 py-2 bg-game-blue text-black
          ${
            mintingTokens || mintSuccess
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white'
          }`}
      >
        {!wallet.connected
          ? 'Connect Wallet to Claim'
          : mintingTokens
          ? 'Minting...'
          : mintSuccess
          ? 'Tokens Claimed!'
          : 'Claim Tokens'}
      </button>

      {mintError && (
        <div className='text-red-500 text-sm mt-2'>{mintError}</div>
      )}

      {mintSuccess && (
        <div className='text-green-500 text-sm mt-2'>
          Tokens successfully minted to your wallet!
        </div>
      )}
    </div>
  )
}

export default ASTRDSMinting
