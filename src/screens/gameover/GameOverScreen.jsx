// src/components/screens/GameOverScreen.jsx
import React, { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameStore } from '../../stores/gameStore'
import { QuarterButton } from '@/components/common/Buttons'
import { useAudio } from '../../hooks/useAudio'
import { SOUND_TYPES, MUSIC_TRACKS } from '../../services/audio/AudioTypes'
import GameTitle from '@/components/common/GameTitle'
import ScreenContainer from '@/components/common/ScreenContainer'

const GameOverScreen = () => {
  const wallet = useWallet()
  const score = useGameStore((state) => state.score)
  const lastGameStats = useGameStore((state) => state.lastGameStats)
  const setGameState = useGameStore((state) => state.setGameState)
  const { playSound, transitionMusic, stopMusic } = useAudio()

  // Music / SFX
  useEffect(() => {
    playSound(SOUND_TYPES.GAME_OVER)
    transitionMusic(MUSIC_TRACKS.GAME, MUSIC_TRACKS.GAME_OVER, {
      crossFadeDuration: 1000,
      allowOverlap: true,
    })
    // No cleanup needed - next screen will handle transition
  }, [])

  const handlePlayAgain = () => {
    setGameState('READY_TO_PLAY')
  }

  const handleViewLeaderboard = () => {
    setGameState('LEADERBOARD')
  }

  const renderAchievement = () => {
    if (!lastGameStats) return null

    if (lastGameStats.isHighScore) {
      return (
        <div className='text-yellow-400 text-2xl animate-pulse mb-4'>
          🏆 NEW HIGH SCORE! 🏆
        </div>
      )
    }

    if (lastGameStats.rank <= 3) {
      return (
        <div className='text-game-blue text-xl mb-4'>🌟 Top 3 Score! 🌟</div>
      )
    }

    return null
  }

  return (
    <ScreenContainer screenType='GAME_OVER'>
      <div className='fixed inset-0 flex items-center justify-center z-40 bg-black/75 backdrop-blur-sm'>
        <div className='max-w-lg w-full mx-4 text-center'>
          <div className='bg-black/50 border border-white p-8 animate-fadeIn'>
            <GameTitle />
            <h1 className='text-game-red text-4xl mb-8'>GAME OVER</h1>

            {renderAchievement()}

            <div className='mb-8'>
              <div className='text-2xl mb-2'>Final Score</div>
              <div className='text-4xl text-game-blue font-bold'>
                {score.toLocaleString()}
              </div>
            </div>

            {lastGameStats && (
              <div className='mb-8 space-y-2'>
                <div className='text-gray-400'>
                  Rank: #{lastGameStats.rank} of {lastGameStats.totalPlayers}
                </div>
              </div>
            )}

            <div className='space-y-4'>
              <QuarterButton
                onClick={handlePlayAgain}
                disabled={!wallet.connected}
              >
                Insert Quarter, Play Again
              </QuarterButton>

              <button
                onClick={handleViewLeaderboard}
                className='text-game-blue hover:text-white transition-colors'
              >
                View Leaderboard
              </button>
            </div>

            <div className='mt-8 text-sm text-gray-500'>
              Tip: Practice makes perfect! Keep playing to improve your score.
            </div>
          </div>
        </div>
      </div>
    </ScreenContainer>
  )
}

export default GameOverScreen
