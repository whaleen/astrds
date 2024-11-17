// src/screens/tokenomics/TokenomicsScreen.jsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import {
  Coins,
  Wallet,
  Users,
  CreditCard,
  Sparkles,
  CircleDollarSign,
  ExternalLink,
  Flame,
} from 'lucide-react'

const MINT_ADDRESS = new PublicKey(
  '8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP'
)
const GAME_TREASURY = new PublicKey(
  'AMKzF4Phzhp8htd9xerLSm1aderQT7t2v35HzbhDAjvE'
)

const TestBurnButton = () => {
  const { publicKey } = useWallet()
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    signature: null,
  })

  const testBurn = async () => {
    if (!publicKey) return

    try {
      setStatus({ loading: true, error: null, signature: null })
      console.log('Testing burn with wallet:', publicKey.toString())

      const response = await fetch('/.netlify/functions/burnTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerPublicKey: publicKey.toString(),
          amount: 1000, // Test with 1000 ASTRDS
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
      <button
        onClick={testBurn}
        disabled={!publicKey || status.loading}
        className={`px-4 py-2 bg-game-blue text-black w-full
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
          : 'Test Burn 1000 ASTRDS'}
      </button>

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

const TokenomicsScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSupply: 0,
    holders: 0,
    treasuryBalance: 0,
    burnedTokens: 0,
  })

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const connection = new Connection(
          import.meta.env.VITE_SOLANA_RPC_ENDPOINT,
          'confirmed'
        )

        const tokenSupply = await connection.getTokenSupply(MINT_ADDRESS)
        const accounts = await connection.getTokenLargestAccounts(MINT_ADDRESS)
        const treasuryBalance = await connection.getBalance(GAME_TREASURY)

        setStats({
          totalSupply: tokenSupply.value.uiAmount || 0,
          holders: accounts.value.length || 0,
          treasuryBalance: treasuryBalance / 1e9,
          burnedTokens: 0, // TODO: Add burn tracking
        })
      } catch (error) {
        console.error('Failed to fetch token data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenData()
  }, [])

  const StatCard = ({ icon: Icon, title, value, subtext, link }) => (
    <div className='bg-black/30 border border-white/10 rounded-lg p-6 hover:border-game-blue/50 transition-colors'>
      <div className='flex items-start justify-between mb-4'>
        <div>
          <h3 className='text-sm text-game-blue flex items-center gap-2'>
            <Icon size={16} />
            {title}
          </h3>
          <div className='text-2xl font-mono mt-2'>{value}</div>
        </div>
        {link && (
          <a
            href={link}
            target='_blank'
            rel='noopener noreferrer'
            className='text-gray-400 hover:text-white transition-colors'
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
      {subtext && <div className='text-xs text-gray-400'>{subtext}</div>}
    </div>
  )

  const InfoSection = ({ title, children }) => (
    <div className='bg-black/30 border border-white/10 rounded-lg p-6'>
      <h3 className='text-sm text-game-blue mb-4'>{title}</h3>
      <div className='space-y-2 text-sm text-gray-300'>{children}</div>
    </div>
  )

  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm'>
      <div className='w-full min-h-screen py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl text-game-blue mb-2'>$ASTRD</h1>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Left Column - Token Stats */}
            <div className='space-y-6'>
              <div className='grid grid-cols-1 gap-4'>
                <StatCard
                  icon={Coins}
                  title='Total Supply'
                  value={
                    loading
                      ? '...'
                      : `${stats.totalSupply.toLocaleString()} $ASTRD`
                  }
                  subtext='Maximum supply is uncapped, tokens are minted through gameplay'
                  link={`https://solscan.io/token/${MINT_ADDRESS.toString()}`}
                />

                <StatCard
                  icon={Users}
                  title='Token Holders'
                  value={loading ? '...' : stats.holders.toLocaleString()}
                  subtext='Unique wallet addresses holding $ASTRD'
                />

                <StatCard
                  icon={Wallet}
                  title='Game Treasury'
                  value={
                    loading
                      ? '...'
                      : `${stats.treasuryBalance.toLocaleString()} SOL`
                  }
                  subtext='Balance from game fees'
                  link={`https://solscan.io/account/${GAME_TREASURY.toString()}`}
                />
              </div>

              {/* Burn Testing Section */}
              <div className='bg-black/30 border border-white/10 rounded-lg p-6'>
                <h3 className='text-lg text-game-blue mb-4 flex items-center gap-2'>
                  <Flame size={20} />
                  Burn Testing
                </h3>
                <p className='text-sm text-gray-400 mb-4'>
                  Test the token burn mechanism. This will burn 1000 ASTRDS
                  tokens from your wallet.
                </p>
                <TestBurnButton />
              </div>
            </div>

            {/* Right Column - Info */}
            <div className='space-y-6'>
              <InfoSection title='Token Utility'>
                <div className='space-y-4'>
                  <div className='flex items-start gap-3'>
                    <CreditCard
                      className='text-game-blue mt-1'
                      size={16}
                    />
                    <p>
                      Pay game fees with $ASTRD instead of SOL (1000 $ASTRD =
                      0.05 SOL)
                    </p>
                  </div>

                  <div className='flex items-start gap-3'>
                    <CircleDollarSign
                      className='text-game-blue mt-1'
                      size={16}
                    />
                    <p>Earn $ASTRD by collecting tokens during gameplay</p>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Sparkles
                      className='text-game-blue mt-1'
                      size={16}
                    />
                    <p>
                      Future utility: cosmetic upgrades, special game modes, DAO
                      governance
                    </p>
                  </div>
                </div>
              </InfoSection>

              <InfoSection title='Token Distribution'>
                <ul className='list-disc list-inside space-y-2'>
                  <li>No pre-mine or team allocation</li>
                  <li>100% of tokens are earned through gameplay</li>
                  <li>1 collected token = 1 $ASTRD minted</li>
                  <li>Maximum 200 tokens can be collected per game</li>
                </ul>
              </InfoSection>

              <InfoSection title='Contract Addresses'>
                <div className='space-y-2 font-mono text-xs'>
                  <div>
                    <div className='text-gray-400 mb-1'>Token Address:</div>
                    <a
                      href={`https://solscan.io/token/${MINT_ADDRESS.toString()}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-game-blue hover:text-white transition-colors break-all'
                    >
                      {MINT_ADDRESS.toString()}
                    </a>
                  </div>
                  <div>
                    <div className='text-gray-400 mb-1'>Treasury Address:</div>
                    <a
                      href={`https://solscan.io/account/${GAME_TREASURY.toString()}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-game-blue hover:text-white transition-colors break-all'
                    >
                      {GAME_TREASURY.toString()}
                    </a>
                  </div>
                </div>
              </InfoSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenomicsScreen
