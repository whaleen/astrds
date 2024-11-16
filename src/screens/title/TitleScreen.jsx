// src/screens/title/TitleScreen.jsx
import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameStore } from '../../stores/gameStore'
import ScreenContainer from '@/components/common/ScreenContainer'
import GameTitle from '@/components/common/GameTitle'
import ActionButtons from '@/components/common/ActionButtons'
import { QuarterButton } from '@/components/common/Buttons'
import PaymentModal from './PaymentModal'
import { useAudio } from '../../hooks/useAudio'
import { useAuth } from '@/hooks/useAuth'
import { MUSIC_TRACKS, SOUND_TYPES } from '../../services/audio/AudioTypes'

const TitleScreen = () => {
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const wallet = useWallet()
  const setGameState = useGameStore((state) => state.setGameState)
  const isProcessing = useGameStore((state) => state.isProcessing)
  const { playMusic, playSound } = useAudio()
  const { isVerifying, error, verifyWallet } = useAuth()

  // Dev quick start with signature
  const handleDevQuarterInsert = async () => {
    if (!wallet.connected) return

    try {
      setIsPaymentModalVisible(false)
      playSound(SOUND_TYPES.QUARTER_INSERT)

      const success = await verifyWallet()
      if (success) {
        setGameState('READY_TO_PLAY')
      }
    } catch (err) {
      console.error('Dev quarter insert failed:', err)
    }
  }

  // Production flow with payment modal
  const handleQuarterClick = () => {
    if (!wallet.connected) return
    setIsPaymentModalVisible(true)
  }

  const handlePaymentSelected = async (paymentType) => {
    try {
      setIsPaymentModalVisible(false)
      playSound(SOUND_TYPES.QUARTER_INSERT)

      const success = await verifyWallet()
      if (success) {
        setGameState('READY_TO_PLAY')
      }
    } catch (err) {
      console.error('Payment failed:', err)
    }
  }

  return (
    <ScreenContainer>
      <GameTitle />
      <ActionButtons>
        <QuarterButton
          onClick={handleQuarterClick}
          disabled={!wallet.connected || isProcessing || isVerifying}
          loading={isProcessing || isVerifying}
        />
        <button
          onClick={handleDevQuarterInsert}
          className='text-xs text-gray-500 hover:text-gray-400 mt-2'
          disabled={isVerifying}
        >
          [DEV] Quick Start with Signature
        </button>
      </ActionButtons>

      {!wallet.connected && (
        <p className='text-gray-400 mt-4 text-center'>
          Connect your wallet to play
        </p>
      )}

      {error && <p className='text-red-500 mt-4 text-center'>{error}</p>}

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
