// src/components/screens/TitleScreen.jsx
import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameStore } from '../../stores/gameStore'
import ScreenContainer from '../layout/ScreenContainer'
import GameTitle from '../ui/GameTitle'
import ActionButtons from '../ui/ActionButtons'
import { QuarterButton } from '../ui/Buttons'
import PaymentModal from '../ui/PaymentModal'
import { useAudio } from '../../hooks/useAudio'
import { MUSIC_TRACKS, SOUND_TYPES } from '../../services/audio/AudioTypes'

const TitleScreen = () => {
  console.log('TitleScreen rendering')

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const wallet = useWallet()
  const setGameState = useGameStore((state) => state.setGameState)
  const isProcessing = useGameStore((state) => state.isProcessing)

  const { playMusic, playSound, stopMusic, isInitialized, currentMusic } =
    useAudio()

  // Start title music when component mounts
  useEffect(() => {
    console.log('TitleScreen mount effect starting') // Add this

    let mounted = true

    const startMusic = async () => {
      try {
        if (mounted) {
          console.log('Attempting to play title music...')

          await playMusic(MUSIC_TRACKS.TITLE, {
            fadeIn: true,
            loop: true,
          })
          console.log('Title music should be playing now')
        }
      } catch (error) {
        console.log('TitleScreen cleanup triggered. Mounted:', mounted) // Add this
        mounted = false
        console.log('Cleaning up title music...')
        stopMusic(MUSIC_TRACKS.TITLE, { fadeOut: true })
      }
    }

    startMusic()

    return () => {
      mounted = false
      console.log('Cleaning up title music...')
      stopMusic(MUSIC_TRACKS.TITLE, { fadeOut: true })
    }
  }, []) // Empty dependency array since we know audio is initialized

  // Original quarter insert method with signature (for development)
  const handleDevQuarterInsert = async () => {
    console.log('Dev Quarter Insert clicked')
    if (!wallet.connected) return

    try {
      setIsPaymentModalVisible(false)
      // Play quarter insert sound using new audio system
      playSound(SOUND_TYPES.QUARTER_INSERT)
      // Go directly to ready screen which will handle signature
      setGameState('READY_TO_PLAY')
    } catch (error) {
      console.error('Error inserting quarter:', error)
    }
  }

  // New payment modal method
  const handleQuarterClick = () => {
    console.log('Quarter Click clicked')
    if (!wallet.connected) return
    setIsPaymentModalVisible(true)
  }

  const handlePaymentSelected = async (paymentType) => {
    try {
      setShowPaymentModal(false)
      playSound(SOUND_TYPES.QUARTER_INSERT)
      // After payment verification, start the game
      setGameState('READY_TO_PLAY')
    } catch (error) {
      console.error('Payment failed:', error)
    }
  }

  return (
    <ScreenContainer>
      <GameTitle />
      <ActionButtons>
        <QuarterButton
          onClick={handleQuarterClick}
          disabled={!wallet.connected || isProcessing}
          loading={isProcessing}
        />
        <button
          onClick={handleDevQuarterInsert}
          className='text-xs text-gray-500 hover:text-gray-400 mt-2'
        >
          [DEV] Quick Start with Signature
        </button>
      </ActionButtons>
      {!wallet.connected && (
        <p className='text-gray-400 mt-4 text-center'>
          Connect your wallet to play
        </p>
      )}

      {isPaymentModalVisible && (
        <PaymentModal
          onClose={() => setIsPaymentModalVisible(false)}
          onPaymentSelected={handlePaymentSelected}
        />
      )}
    </ScreenContainer>
  )
}

export default TitleScreen
