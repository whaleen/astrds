// src/components/screens/TitleScreen.jsx
import React, { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameStore } from '../../stores/gameStore'
import { useAudioStore } from '../../stores/audioStore'
import ScreenContainer from '../layout/ScreenContainer'
import GameTitle from '../ui/GameTitle'
import ActionButtons from '../ui/ActionButtons'
import { QuarterButton } from '../ui/Buttons'

const TitleScreen = () => {
  const wallet = useWallet()
  const setGameState = useGameStore((state) => state.setGameState)
  const isProcessing = useGameStore((state) => state.isProcessing)
  const playMusic = useAudioStore((state) => state.playMusic)
  const playSound = useAudioStore((state) => state.playSound)

  useEffect(() => {
    // Start title music with fade in when screen mounts
    playMusic('titleMusic', {
      fadeIn: true,
      loop: true,
    })
  }, [playMusic])

  const handleQuarterInsert = async () => {
    if (!wallet.connected) return

    try {
      // Play quarter insert sound
      playSound('quarterInsert')
      setGameState('READY_TO_PLAY')
    } catch (error) {
      console.error('Error inserting quarter:', error)
    }
  }

  return (
    <ScreenContainer>
      <GameTitle />
      <ActionButtons>
        <QuarterButton
          onClick={handleQuarterInsert}
          disabled={!wallet.connected || isProcessing}
          loading={isProcessing}
        />
      </ActionButtons>

      {!wallet.connected && (
        <p className='text-gray-400 mt-4 text-center'>
          Connect your wallet to play
        </p>
      )}
    </ScreenContainer>
  )
}

export default TitleScreen
