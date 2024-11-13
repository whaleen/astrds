// src/components/screens/ReadyScreen.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGame } from '../../hooks/useGame'
import { verifyWalletSignature } from '../../auth'
import { soundManager } from '../../sounds/SoundManager'
import ScreenContainer from '../layout/ScreenContainer'
import GameTitle from '../ui/GameTitle'
import { Connection } from '@solana/web3.js'

const ReadyScreen = () => {
  const { actions } = useGame()
  const wallet = useWallet()
  const [countdown, setCountdown] = useState(null) // null for initial state
  const [verificationError, setVerificationError] = useState(null)
  const hasStarted = useRef(false)
  const mountedRef = useRef(true)

  // Separate useEffect for game sequence initialization
  useEffect(() => {
    console.log('ReadyScreen mounted, setting up game sequence...')
    mountedRef.current = true

    return () => {
      console.log('ReadyScreen cleanup triggered')
      mountedRef.current = false
    }
  }, [])

  // Separate useEffect for game sequence execution
  useEffect(() => {
    let countdownTimer

    const startGameSequence = async () => {
      if (hasStarted.current) return
      hasStarted.current = true

      try {
        console.log('Starting game sequence...')
        console.log('Mounted status:', mountedRef.current)

        // Transition from title to ready music
        console.log('Transitioning music...')
        await soundManager.transitionMusic('titleMusic', 'readyMusic', {
          crossFadeDuration: 1000,
        })
        console.log('Music transition complete')

        if (!mountedRef.current) {
          console.log('Component unmounted during music transition, aborting')
          return
        }

        // Initialize Solana connection using environment variable
        console.log('Initializing Solana connection...')
        const connection = new Connection(
          import.meta.env.VITE_SOLANA_RPC_ENDPOINT,
          {
            commitment: 'confirmed',
            wsEndpoint: import.meta.env.VITE_SOLANA_RPC_ENDPOINT.replace(
              'https',
              'wss'
            ),
            confirmTransactionInitialTimeout: 60000,
          }
        )

        console.log('Verifying wallet signature...')
        const isVerified = await verifyWalletSignature(wallet, connection)
        if (!isVerified) throw new Error('Wallet signature verification failed')

        if (!mountedRef.current) {
          console.log('Component unmounted during verification, aborting')
          return
        }

        console.log('Wallet verified, starting countdown...')
        console.log('Mounted status before countdown:', mountedRef.current)

        // Start countdown immediately
        setCountdown(3)

        // Use a Promise-based delay instead of setInterval
        for (let i = 3; i >= 0; i--) {
          if (!mountedRef.current) {
            console.log('Component unmounted during countdown, aborting')
            return
          }

          setCountdown(i)
          console.log('Countdown:', i)

          if (i > 0) {
            soundManager.playSound('countdownPing')
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }

        // Final check before starting game
        if (mountedRef.current) {
          console.log('Starting game and transitioning music')
          soundManager.transitionMusic('readyMusic', 'gameMusic', {
            crossFadeDuration: 1000,
          })
          actions.startGame()
        }
      } catch (error) {
        console.error('Game start sequence failed:', error)
        if (mountedRef.current) {
          soundManager.stopAll()
          setVerificationError(error.message)
          actions.toggleFullChat(null)
        }
      }
    }

    startGameSequence()

    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
    }
  }, [actions, wallet])

  if (verificationError) {
    return (
      <ScreenContainer>
        <div className='text-center'>
          <GameTitle />
          <div className='text-game-red text-xl mb-6'>Failed to start game</div>
          <p className='text-gray-400 mb-4'>{verificationError}</p>
          <button
            onClick={() => window.location.reload()}
            className='text-game-blue hover:text-white transition-colors'
          >
            Return to Title
          </button>
        </div>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <div className='text-center'>
        <GameTitle />
        <div className='my-12 h-32 flex items-center justify-center'>
          <div
            className='text-8xl font-bold text-game-blue animate-[fadeIn_0.3s_ease-out]
                         [text-shadow:0_0_10px_#4dc1f9,0_0_20px_#4dc1f9,0_0_30px_#4dc1f9]'
          >
            {countdown === null ? (
              <div className='text-4xl'>Verifying Connection</div>
            ) : countdown === 0 ? (
              'GO!'
            ) : (
              countdown
            )}
          </div>
        </div>

        <div className='space-y-6 transition-opacity duration-300'>
          {countdown !== null && (
            <>
              <p
                className={`text-xl text-gray-300 ${
                  countdown >= 2 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Use [A][S][W][D] or Arrow Keys to move
              </p>
              <p
                className={`text-xl text-gray-300 ${
                  countdown >= 1 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Press [SPACE] to shoot
              </p>
              <p
                className={`text-xl text-gray-300 ${
                  countdown === 0 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Good luck, pilot!
              </p>
            </>
          )}
        </div>

        <div className='mt-16 text-gray-500 text-sm max-w-md mx-auto'>
          <p>
            Tip: Destroy asteroids to earn points. Smaller asteroids are worth
            more points!
          </p>
        </div>
      </div>
    </ScreenContainer>
  )
}

export default ReadyScreen
