import React, { useState, useEffect } from 'react'
import { getHighScores } from '../api/scores'

const EnhancedLeaderboard = ({ currentScore, onClose, initialScores = [] }) => {
  const [scores, setScores] = useState(initialScores)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRank, setUserRank] = useState(null)

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const highScores = await getHighScores()
        setScores(highScores)

        // Find user's rank if they have a current score
        if (currentScore > 0) {
          const rank =
            highScores.findIndex((score) => score.score <= currentScore) + 1
          setUserRank(rank > 0 ? rank : highScores.length + 1)
        }
      } catch (err) {
        setError('Failed to load high scores')
      } finally {
        setLoading(false)
      }
    }
    fetchScores()
  }, [currentScore, initialScores])

  // Shorten wallet address for display
  const shortenAddress = (address) => {
    if (!address || address === 'Anonymous') return 'Anonymous'
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className='fixed inset-0 bg-black/75 flex items-center justify-center z-50'>
      <div className='bg-black p-6 max-w-3xl w-full mx-4'>
        <h2 className='text-2xl text-game-blue text-center mb-6'>
          High Scores
        </h2>

        {loading ? (
          <div className='text-center text-game-blue py-8'>
            Loading scores...
          </div>
        ) : error ? (
          <div className='text-red-400 text-center py-4'>{error}</div>
        ) : (
          <>
            {userRank && currentScore > 0 && (
              <div className='mb-4 text-center text-green-400'>
                Your Rank: {userRank === 1 ? '🏆' : userRank}
                {userRank <= 3 && ' 🎉'}
              </div>
            )}

            <div className='space-y-2'>
              <div className='grid grid-cols-4 gap-4 text-sm text-gray-400 mb-2'>
                <div>Rank</div>
                <div>Player</div>
                <div className='text-right'>Score</div>
                <div className='text-right'>Date</div>
              </div>

              {scores.map((score, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-4 gap-4 ${
                    currentScore === score.score
                      ? 'text-green-400'
                      : 'text-white'
                  } ${index < 3 ? 'text-lg font-bold' : ''}`}
                >
                  <div>
                    {index === 0
                      ? '🥇'
                      : index === 1
                      ? '🥈'
                      : index === 2
                      ? '🥉'
                      : index + 1}
                  </div>
                  <div>{shortenAddress(score.walletAddress)}</div>
                  <div className='text-right'>
                    {score.score.toLocaleString()}
                  </div>
                  <div className='text-right text-sm'>
                    {formatDate(score.date)}
                  </div>
                </div>
              ))}

              {scores.length === 0 && (
                <div className='text-center text-gray-400 py-8'>
                  No scores yet - be the first!
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className='mt-6 w-full bg-transparent border-2 border-game-blue text-game-blue 
                     py-2 px-4 hover:bg-game-blue hover:text-black transition-colors'
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default EnhancedLeaderboard
