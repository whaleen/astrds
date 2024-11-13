// src/components/screens/LeaderboardScreen.jsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGame } from '../../hooks/useGame'
import { getHighScores } from '../../api/scores'
import ScreenContainer from '../layout/ScreenContainer'
import { QuarterButton } from '../ui/Buttons'
import GameTitle from '../ui/GameTitle'
import ActionButtons from '../ui/ActionButtons'
import LeaderboardTable from './LeaderboardTable'
import LeaderboardRank from './LeaderboardRank'
import { soundManager } from '../../sounds/SoundManager'

const LeaderboardScreen = () => {
  const { state, actions } = useGame()
  const wallet = useWallet()
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRank, setUserRank] = useState(null)

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true)
        const highScores = await getHighScores()
        setScores(highScores)

        // Play ambient sound
        soundManager.playSound('spaceWind', {
          fadeIn: true,
          loop: true,
        })

        // Calculate user's rank if they have a current score
        if (state.score > 0) {
          const rank =
            highScores.findIndex((score) => score.score <= state.score) + 1
          setUserRank(rank > 0 ? rank : highScores.length + 1)
        }
      } catch (err) {
        console.error('Failed to fetch scores:', err)
        setError('Failed to load high scores')
      } finally {
        setLoading(false)
      }
    }

    fetchScores()

    return () => {
      // soundManager.stopMusic('creditsMusic', { fadeOut: true })
    }
  }, [state.score])

  const handlePlayAgain = () => {
    actions.insertQuarter()
  }

  return (
    <ScreenContainer className='bg-black/75'>
      <div className='max-w-2xl w-full mx-auto'>
        <GameTitle />

        {/* Action Buttons */}
        <ActionButtons className='mt-8'>
          <QuarterButton
            onClick={handlePlayAgain}
            disabled={!wallet.connected}
          >
            Insert Quarter, Play Again
          </QuarterButton>
        </ActionButtons>
        {/* Score Summary */}
        <div className='text-center mb-8'>
          <h2 className='text-2xl text-game-red mb-4'>Game Over!</h2>
          <p className='text-lg text-white'>
            {state.score > 0
              ? `Final Score: ${state.score.toLocaleString()} Points!`
              : 'No points... Better luck next time!'}
          </p>
        </div>

        {/* User Rank (if applicable) */}
        {userRank && state.score > 0 && <LeaderboardRank rank={userRank} />}

        {/* Leaderboard Table with Loading State */}
        <div className='mb-8 min-h-[320px]'>
          {error ? (
            <div className='text-red-400 text-center py-4 bg-red-400/10 rounded border border-red-400/20'>
              {error}
              <button
                onClick={() => window.location.reload()}
                className='block mx-auto mt-2 text-sm text-red-400 hover:text-red-300'
              >
                Try Again
              </button>
            </div>
          ) : (
            <LeaderboardTable
              scores={scores}
              currentScore={state.score}
              loading={loading}
            />
          )}
        </div>
      </div>
    </ScreenContainer>
  )
}

export default LeaderboardScreen
