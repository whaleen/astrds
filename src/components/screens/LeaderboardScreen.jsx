// src/components/screens/LeaderboardScreen.jsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getHighScores } from '../../api/scores'
import { QuarterButton } from '../ui/Buttons'
import GameTitle from '../ui/GameTitle'
import LeaderboardTable from './LeaderboardTable'
import LeaderboardRank from './LeaderboardRank'
import { soundManager } from '../../sounds/SoundManager'
import { useGameStore } from '../../stores/gameStore'

const LeaderboardScreen = () => {
  const wallet = useWallet()
  const score = useGameStore((state) => state.score)
  const topScore = useGameStore((state) => state.topScore)
  const insertQuarter = useGameStore((state) => state.setGameState)

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

        soundManager.playSound('spaceWind', {
          fadeIn: true,
          loop: true,
        })

        if (score > 0) {
          const rank = highScores.findIndex((s) => s.score <= score) + 1
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
  }, [score])

  const handlePlayAgain = () => {
    insertQuarter('READY_TO_PLAY')
  }

  return (
    <div className='fixed inset-0 flex items-center justify-center z-40 bg-black/75 backdrop-blur-sm'>
      <div className='w-full min-h-screen py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          {/* Top Section - Title and Play Again */}
          <div className='text-center mb-8'>
            <GameTitle />
            <QuarterButton
              onClick={handlePlayAgain}
              disabled={!wallet.connected}
              className='mt-4'
            >
              Insert Quarter, Play Again
            </QuarterButton>
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Left Column - Game Summary */}
            <div className='space-y-6'>
              {/* Game Over Summary */}
              <div className='bg-black/50 border border-white/10 rounded-lg p-6'>
                <h2 className='text-2xl text-game-red mb-4'>Game Over!</h2>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-white/80'>Final Score:</span>
                    <span className='text-xl font-mono text-white'>
                      {score.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-white/80'>Top Score:</span>
                    <span className='text-xl font-mono text-game-blue'>
                      {topScore.toLocaleString()}
                    </span>
                  </div>
                  {userRank && (
                    <div className='flex justify-between items-center'>
                      <span className='text-white/80'>Your Rank:</span>
                      <span className='text-xl font-mono text-game-blue'>
                        #{userRank}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievement Section */}
              {userRank && score > 0 && (
                <div className='bg-black/50 border border-white/10 rounded-lg p-6'>
                  <LeaderboardRank rank={userRank} />
                </div>
              )}

              {/* Tips Section */}
              <div className='bg-black/50 border border-white/10 rounded-lg p-6'>
                <h3 className='text-lg text-game-blue mb-3'>Pro Tips</h3>
                <ul className='space-y-2 text-sm text-white/80'>
                  <li>• Smaller asteroids are worth more points</li>
                  <li>• Collect power-ups to enhance your ship</li>
                  <li>• Use chat to connect with other players</li>
                  <li>• Press [P] to pause and view controls</li>
                </ul>
              </div>
            </div>

            {/* Right Column - Leaderboard */}
            <div className='bg-black/50 border border-white/10 rounded-lg p-6'>
              <h2 className='text-xl text-game-blue mb-4'>
                Global Leaderboard
              </h2>
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
                  currentScore={score}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardScreen
