import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const TestBurnButton = () => {
  const { publicKey } = useWallet()
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    signature: null,
  })
  const [amount, setAmount] = useState(1000) // Default amount

  const testBurn = async () => {
    if (!publicKey) {
      console.log('Wallet not connected')
      return
    }

    if (amount <= 0 || isNaN(amount)) {
      setStatus({
        loading: false,
        error: 'Invalid burn amount',
        signature: null,
      })
      return
    }

    try {
      setStatus({ loading: true, error: null, signature: null })
      console.log(
        'Testing burn with wallet:',
        publicKey.toString(),
        'Amount:',
        amount
      )

      const response = await fetch('/.netlify/functions/burnTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerPublicKey: publicKey.toString(),
          amount: parseInt(amount, 10), // Convert to integer
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Burn failed')
      }

      setStatus({
        loading: false,
        error: null,
        signature: result.signature,
      })

      console.log('Burn successful:', result.signature)
    } catch (error) {
      console.error('Burn test failed:', error)
      setStatus({
        loading: false,
        error: error.message,
        signature: null,
      })
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center space-x-4'>
        <input
          type='number'
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className='px-2 py-1 border rounded-md'
          placeholder='Enter amount to burn'
          min='1'
          disabled={status.loading}
        />
        <button
          onClick={testBurn}
          disabled={!publicKey || status.loading}
          className={`px-4 py-2 bg-game-blue text-black 
          ${
            status.loading || !publicKey
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white'
          }`}
        >
          {!publicKey
            ? 'Connect Wallet to Test'
            : status.loading
            ? 'Burning...'
            : `Burn ${amount || 0} ASTRDS`}
        </button>
      </div>

      {status.error && (
        <div className='text-red-500 text-sm'>Error: {status.error}</div>
      )}

      {status.signature && (
        <div className='text-green-500 text-sm'>
          Success! Transaction:
          <a
            href={`https://explorer.solana.com/tx/${status.signature}?cluster=devnet`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-game-blue hover:underline ml-2'
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  )
}

export default TestBurnButton
