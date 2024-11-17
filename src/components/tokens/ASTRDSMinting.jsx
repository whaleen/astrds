// src/components/tokens/ASTRDSMinting.jsx
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, Transaction } from '@solana/web3.js'

const ASTRDSMinting = ({ tokenCount }) => {
  const wallet = useWallet()
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
    signature: null,
  })

  const mintGameTokens = async () => {
    if (!wallet.connected || tokenCount === 0) return

    try {
      setStatus({ loading: true, error: null, success: false, signature: null })

      // 1. Get the transaction from our backend
      const response = await fetch('/.netlify/functions/mintTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerPublicKey: wallet.publicKey.toBase58(),
          tokenCount: Number(tokenCount),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to build transaction')
      }

      // 2. Deserialize and sign the transaction
      const connection = new Connection(
        'https://api.devnet.solana.com',
        'confirmed'
      )
      const transaction = Transaction.from(
        Buffer.from(result.serializedTransaction, 'base64')
      )
      const signedTx = await wallet.signTransaction(transaction)

      // 3. Send and confirm the transaction
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      )

      console.log('Transaction sent:', signature)

      const confirmation = await connection.confirmTransaction(signature, {
        commitment: 'confirmed',
        maxRetries: 3,
      })

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        )
      }

      setStatus({
        loading: false,
        error: null,
        success: true,
        signature,
      })
    } catch (error) {
      console.error('Minting error:', error)
      setStatus({
        loading: false,
        error: error.message || 'Failed to mint tokens. Please try again.',
        success: false,
        signature: null,
      })
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
        disabled={status.loading || !wallet.connected || status.success}
        className={`mt-4 px-4 py-2 bg-game-blue text-black
          ${
            status.loading || status.success
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white'
          }`}
      >
        {!wallet.connected
          ? 'Connect Wallet to Claim'
          : status.loading
          ? 'Minting...'
          : status.success
          ? 'Tokens Claimed!'
          : 'Claim Tokens'}
      </button>

      {status.error && (
        <div className='text-red-500 text-sm mt-2'>{status.error}</div>
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
