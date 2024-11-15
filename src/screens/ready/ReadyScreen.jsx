// src/screens/ready/ReadyScreen.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection } from '@solana/web3.js'
import { verifyWalletSignature } from '@/auth/auth'
import { useAudio } from '../../hooks/useAudio'
import { SOUND_TYPES, MUSIC_TRACKS } from '../../services/audio/AudioTypes'
import ScreenContainer from '@/components/common/ScreenContainer'
import GameTitle from '@/components/common/GameTitle'
import { useGameStore } from '../../stores/gameStore'

const ReadyScreen = () => {
  const wallet = useWallet()
  const [countdown, setCountdown] = useState(null)
  const [verificationError, setVerificationError] = useState(null)
  const hasStarted = useRef(false)
  const mountedRef = useRef(true)

  const setGameState = useGameStore((state) => state.setGameState)
  const { playSound, playMusic, stopMusic, transitionMusic } = useAudio()

  useEffect(() => {
    console.log('ReadyScreen mounted, setting up game sequence...')
    mountedRef.current = true

    return () => {
      console.log('ReadyScreen cleanup triggered')
      mountedRef.current = false
      stopMusic(MUSIC_TRACKS.READY, { fadeOut: true })
    }
  }, [stopMusic])

  useEffect(() => {
    const startGameSequence = async () => {
      if (hasStarted.current) return
      hasStarted.current = true

      try {
        console.log('Starting game sequence...')

        // Transition from title to ready music
        console.log('Transitioning to ready music...')
        await transitionMusic(MUSIC_TRACKS.TITLE, MUSIC_TRACKS.READY, {
          crossFadeDuration: 1000,
        })

        if (!mountedRef.current) return

        // Initialize Solana connection
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

        const isVerified = await verifyWalletSignature(wallet, connection)
        if (!isVerified) throw new Error('Wallet signature verification failed')
        if (!mountedRef.current) return

        // Countdown sequence
        setCountdown(3)
        for (let i = 3; i >= 0; i--) {
          if (!mountedRef.current) return

          setCountdown(i)
          if (i > 0) {
            await playSound(SOUND_TYPES.COUNTDOWN_PING)
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }

        // Start game if still mounted
        if (mountedRef.current) {
          await transitionMusic(MUSIC_TRACKS.READY, MUSIC_TRACKS.GAME, {
            crossFadeDuration: 1000,
          })
          setGameState('PLAYING')
        }
      } catch (error) {
        console.error('Game start sequence failed:', error)
        if (mountedRef.current) {
          // Clean up audio and show error
          await stopMusic(MUSIC_TRACKS.READY, { fadeOut: true })
          await stopMusic(MUSIC_TRACKS.GAME, { fadeOut: true })
          setVerificationError(error.message)
        }
      }
    }

    startGameSequence()
  }, [wallet, playSound, playMusic, stopMusic, transitionMusic, setGameState])

  if (verificationError) {
    return (
      <ScreenContainer>
        <div className='text-center'>
          <GameTitle />
          <div className='text-game-red text-xl mb-6'>Failed to start game</div>
          <p className='text-gray-400 mb-4'>{verificationError}</p>
          <button
            onClick={() => {
              stopMusic(MUSIC_TRACKS.READY)
              setGameState('INITIAL')
            }}
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
              <div className='text-4xl'>Inserting Quarter...</div>
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
