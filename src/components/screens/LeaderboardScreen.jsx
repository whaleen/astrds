// src/components/screens/LeaderboardScreen.jsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getHighScores } from '../../api/scores'
import { QuarterButton } from '../ui/Buttons'
import GameTitle from '../ui/GameTitle'
import LeaderboardTable from './LeaderboardTable'
import { useGameStore } from '../../stores/gameStore'

const LeaderboardScreen = () => {
  const wallet = useWallet()
  const topScore = useGameStore((state) => state.topScore)
  const setGameState = useGameStore((state) => state.setGameState)

  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playerStats, setPlayerStats] = useState({
    topScore: 0,
    rank: null,
  })

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true)
        const highScores = await getHighScores()

        if (!Array.isArray(highScores)) {
          console.error('Invalid scores data:', highScores)
          throw new Error('Invalid scores data received')
        }

        setScores(highScores)

        // If wallet is connected, find player's best score and rank
        if (wallet.publicKey) {
          const walletAddress = wallet.publicKey.toString()
          const playerScores = highScores.filter(
            (s) => s.walletAddress === walletAddress
          )

          if (playerScores.length > 0) {
            // Find player's best score
            const bestScore = Math.max(...playerScores.map((s) => s.score))
            // Find player's highest rank
            const bestRank =
              highScores.findIndex(
                (s) =>
                  s.walletAddress === walletAddress && s.score === bestScore
              ) + 1

            setPlayerStats({
              topScore: bestScore,
              rank: bestRank > 0 ? bestRank : null,
            })

            // Update global top score in game store if needed
            if (bestScore > topScore) {
              useGameStore.getState().updateScore(bestScore)
            }
          }
        }

        // soundManager.playSound('spaceWind', {
        //   fadeIn: true,
        //   loop: true,
        // })
      } catch (err) {
        console.error('Failed to fetch scores:', err)
        setError('Failed to load high scores')
      } finally {
        setLoading(false)
      }
    }

    fetchScores()
  }, [wallet.publicKey, topScore])

  const handlePlayAgain = () => {
    setGameState('READY_TO_PLAY')
  }

  const formatRank = (rank) => {
    if (!rank) return null
    const lastDigit = rank % 10
    const lastTwoDigits = rank % 100
    let suffix = 'th'

    if (lastTwoDigits < 11 || lastTwoDigits > 13) {
      switch (lastDigit) {
        case 1:
          suffix = 'st'
          break
        case 2:
          suffix = 'nd'
          break
        case 3:
          suffix = 'rd'
          break
      }
    }

    return `${rank}${suffix}`
  }

  return (
    <div className='fixed inset-0 flex items-center justify-center z-40 bg-black/75 backdrop-blur-sm'>
      <div className='w-full min-h-screen py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
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

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Left Column - Player Stats */}
            <div className='space-y-6'>
              <div className='bg-black/50 border border-white/10 rounded-lg p-6'>
                <h2 className='text-xl text-game-blue mb-4'>Your Stats</h2>
                <div className='space-y-4'>
                  {wallet.connected ? (
                    <>
                      <div className='flex justify-between items-center'>
                        <span className='text-white/80'>Your Top Score:</span>
                        <span className='text-xl font-mono text-game-blue'>
                          {playerStats.topScore.toLocaleString()}
                        </span>
                      </div>
                      {playerStats.rank && (
                        <div className='flex justify-between items-center'>
                          <span className='text-white/80'>Your Best Rank:</span>
                          <span className='text-xl font-mono text-game-blue'>
                            {formatRank(playerStats.rank)}
                          </span>
                        </div>
                      )}
                      {!playerStats.rank && playerStats.topScore > 0 && (
                        <div className='text-center text-gray-400 text-sm'>
                          Keep playing to reach the top 100!
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='text-center text-gray-400'>
                      Connect wallet to see your stats
                    </div>
                  )}
                </div>
              </div>

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
                Global Leaderboard{' '}
                {scores.length > 0 && `(Top ${scores.length})`}
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
                  loading={loading}
                  playerWallet={wallet.publicKey?.toString()}
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
