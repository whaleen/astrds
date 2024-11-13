// src/components/screens/TitleScreen.jsx
import React, { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGame } from '../../hooks/useGame'
import { soundManager } from '../../sounds/SoundManager'
import ScreenContainer from '../layout/ScreenContainer'
import GameTitle from '../ui/GameTitle'
import ActionButtons from '../ui/ActionButtons'
import { QuarterButton } from '../ui/Buttons'

const TitleScreen = () => {
  const { state, actions } = useGame()
  const wallet = useWallet()

  useEffect(() => {
    // Start title music with fade in when screen mounts
    soundManager.playMusic('titleMusic', {
      fadeIn: true,
      loop: true,
    })

    return () => {
      // Fade out title music when leaving screen
      soundManager.stopMusic('titleMusic', { fadeOut: true })
    }
  }, [])

  const handleQuarterInsert = async () => {
    console.log('Quarter Insert clicked, wallet:', wallet.connected)
    if (!wallet.connected) return

    try {
      // Play quarter insert sound
      soundManager.playSound('quarterInsert')
      actions.insertQuarter()
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
          disabled={!wallet.connected || state.isProcessing}
          loading={state.isProcessing}
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
