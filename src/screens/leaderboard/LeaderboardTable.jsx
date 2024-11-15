import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const LoadingSkeleton = () => (
  <div className='animate-pulse space-y-4'>
    {/* Top 3 Skeleton */}
    {[...Array(3)].map((_, i) => (
      <div
        key={`top-${i}`}
        className='grid grid-cols-4 gap-4 px-4 py-3 rounded bg-white/5'
      >
        <div className='h-6 bg-white/10 rounded' />
        <div className='h-6 bg-white/10 rounded' />
        <div className='h-6 bg-white/10 rounded' />
        <div className='h-6 bg-white/10 rounded' />
      </div>
    ))}

    {/* Divider Skeleton */}
    <div className='h-px bg-white/10' />

    {/* Remaining Scores Skeleton */}
    <div className='h-48 space-y-2'>
      {[...Array(3)].map((_, i) => (
        <div
          key={`rest-${i}`}
          className='grid grid-cols-4 gap-4 px-4 py-2 rounded bg-white/5'
        >
          <div className='h-6 bg-white/10 rounded' />
          <div className='h-6 bg-white/10 rounded' />
          <div className='h-6 bg-white/10 rounded' />
          <div className='h-6 bg-white/10 rounded' />
        </div>
      ))}
    </div>
  </div>
)

const ScoreRow = ({ score, index, isCurrentUser }) => {
  const shortenAddress = (address) => {
    if (!address || address === 'Anonymous') return 'Anonymous'
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getRankEmoji = (index) => {
    switch (index) {
      case 0:
        return '🥇'
      case 1:
        return '🥈'
      case 2:
        return '🥉'
      default:
        return index + 1
    }
  }

  return (
    <div
      className={`grid grid-cols-4 gap-4 px-4 py-2 rounded
        ${isCurrentUser ? 'bg-game-blue/10 text-white' : 'text-gray-300'}
        ${index < 3 ? 'text-lg font-bold py-3' : ''}
        hover:bg-white/5 transition-colors`}
    >
      <div className='flex items-center'>{getRankEmoji(index)}</div>

      <div className='flex items-center space-x-2'>
        <span>{shortenAddress(score.walletAddress)}</span>
        <a
          href={`https://solscan.io/account/${score.walletAddress}`}
          target='_blank'
          rel='noopener noreferrer'
          title='View on Solscan'
          className='text-gray-400 hover:text-white transition-colors'
        >
          ⇗
        </a>
      </div>

      <div className='text-right font-mono'>{score.score.toLocaleString()}</div>

      <div className='text-right text-sm text-gray-400'>
        {formatDate(score.date)}
      </div>
    </div>
  )
}

const LeaderboardTable = ({ scores, loading }) => {
  const wallet = useWallet()

  const isCurrentUser = (scoreAddress) =>
    wallet.publicKey?.toString() === scoreAddress

  if (loading) {
    return <LoadingSkeleton />
  }

  const topThree = scores.slice(0, 3)
  const remainingScores = scores.slice(3)

  return (
    <div className='space-y-4'>
      {/* Table Header */}
      <div className='grid grid-cols-4 gap-4 text-sm text-gray-400 px-4'>
        <div>Rank</div>
        <div>Player</div>
        <div className='text-right'>Score</div>
        <div className='text-right'>Date</div>
      </div>

      {/* Top 3 Podium */}
      <div className='space-y-2'>
        {topThree.map((score, index) => (
          <ScoreRow
            key={`${score.walletAddress}-${score.date}`}
            score={score}
            index={index}
            isCurrentUser={isCurrentUser(score.walletAddress)}
          />
        ))}
      </div>

      {/* Divider */}
      {remainingScores.length > 0 && <div className='h-px bg-white/10 my-4' />}

      {/* Remaining Scores (Scrollable) */}
      {remainingScores.length > 0 ? (
        <div className='max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-game-blue scrollbar-track-white/5'>
          <div className='space-y-1'>
            {remainingScores.map((score, index) => (
              <ScoreRow
                key={`${score.walletAddress}-${score.date}`}
                score={score}
                index={index + 3}
                isCurrentUser={isCurrentUser(score.walletAddress)}
              />
            ))}
          </div>
        </div>
      ) : scores.length === 0 ? (
        <div className='text-center text-gray-400 py-8'>
          No scores yet - be the first!
        </div>
      ) : null}
    </div>
  )
}

export default LeaderboardTable
