import React, { useState, useEffect } from 'react'
import { getHighScores } from '../api/scores'

const Leaderboard = ({ currentScore, onClose }) => {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Leaderboard mounted')
    const fetchScores = async () => {
      console.log('Fetching scores in Leaderboard')
      const highScores = await getHighScores()
      console.log('Got scores:', highScores)
      setScores(highScores)
      setLoading(false)
    }
    fetchScores()
  }, [])

  // Shorten wallet address for display
  const shortenAddress = (address) => {
    if (!address || address === 'Anonymous') return 'Anonymous'
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-black border-2 border-blue-400 p-6 max-w-md w-full mx-4'>
        <h2 className='text-2xl text-blue-400 text-center mb-6'>High Scores</h2>

        {loading ? (
          <div className='text-center text-white'>Loading scores...</div>
        ) : (
          <div className='space-y-2'>
            {scores.map((score, index) => (
              <div
                key={index}
                className={`flex justify-between items-center ${
                  currentScore === score.score ? 'text-green-400' : 'text-white'
                }`}
              >
                <span>{index + 1}.</span>
                <span>{shortenAddress(score.walletAddress)}</span>
                <span>{score.score.toLocaleString()}</span>
              </div>
            ))}
            {scores.length === 0 && (
              <div className='text-center text-gray-400'>No scores yet!</div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className='mt-6 w-full bg-transparent border-2 border-blue-400 text-blue-400 py-2 px-4 hover:bg-blue-400 hover:text-black transition-colors'
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default Leaderboard
