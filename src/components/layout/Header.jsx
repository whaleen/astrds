// src/components/layout/Header.jsx
import React from 'react'
import { useEffect } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MessageSquare } from 'lucide-react'
import VolumeControl from '../VolumeControl'
import { StyledWalletButton } from '../ui/Buttons'
import { useChatStore } from '../../stores/chatStore'
import { useLevelStore } from '../../stores/levelStore'
import { useGameStore } from '../../stores/gameStore'
import { getHighScores } from '../../api/scores'

const GameStats = () => {
  const level = useLevelStore((state) => state.level)
  const score = useGameStore((state) => state.score)
  const topScore = useGameStore((state) => state.topScore)

  useEffect(() => {
    const fetchTopScore = async () => {
      try {
        const scores = await getHighScores()
        if (scores && scores.length > 0) {
          useGameStore.setState({ topScore: scores[0].score })
        }
      } catch (error) {
        console.error('Failed to fetch top score:', error)
      }
    }

    fetchTopScore()
  }, [])

  return (
    <div className='flex items-center gap-6 text-sm'>
      <div className='flex flex-col items-center'>
        <span className='text-game-blue text-xs'>LEVEL</span>
        <span className='font-bold'>{level}</span>
      </div>
      <div className='flex flex-col items-center'>
        <span className='text-game-blue text-xs'>SCORE</span>
        <span className='font-bold'>{score.toLocaleString()}</span>
      </div>
      <div className='flex flex-col items-center'>
        <span className='text-game-blue text-xs'>TOP SCORE</span>
        <span className='font-bold'>{topScore.toLocaleString()}</span>
      </div>
    </div>
  )
}

const Header = () => {
  const { overlayVisible, toggleOverlay } = useChatStore()

  return (
    <header className='fixed top-0 w-full z-50 bg-black/50 backdrop-blur-sm border-b border-white/10 px-4 py-3'>
      <div className='max-w-7xl mx-auto flex justify-between items-center gap-4'>
        {/* Left section */}
        <div className='flex items-center gap-4'>
          <VolumeControl />
        </div>

        {/* Center section */}
        <GameStats />

        {/* Right section */}
        <div className='flex items-center gap-4'>
          <button
            onClick={toggleOverlay}
            className={`h-[48px] px-6 flex items-center justify-center
              border-2 transition-colors duration-200
              ${
                !overlayVisible
                  ? 'border-game-blue bg-transparent text-game-blue hover:bg-game-blue hover:text-black'
                  : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'
              }`}
          >
            <MessageSquare size={20} />
          </button>

          <StyledWalletButton>
            <WalletMultiButton />
          </StyledWalletButton>
        </div>
      </div>
    </header>
  )
}

export default Header
