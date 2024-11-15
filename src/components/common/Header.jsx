// src/components/common/Header.jsx
import React from 'react'
import { useEffect, useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MessageSquare, User } from 'lucide-react'
import { StyledWalletButton } from './Buttons'
import { useChatStore } from '../../stores/chatStore'
import { useLevelStore } from '../../stores/levelStore'
import { useGameStore } from '../../stores/gameStore'
import { getHighScores } from '../../api/scores'
import VolumeControl from '../sound/VolumeControl'
import AccountScreen from '@/screens/account/AccountScreen'

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
  const [showAccount, setShowAccount] = useState(false)
  const { toggleFullChat } = useChatStore()
  const { overlayVisible, toggleOverlay } = useChatStore()
  const gameState = useGameStore((state) => state.gameState)

  // Define what elements should show on each screen
  const shouldShowVolumeControl = true // Always show volume control
  const shouldShowGameStats = ['PLAYING', 'GAME_OVER'].includes(gameState)
  const shouldShowChatButton = ['LEADERBOARD', 'GAME_OVER'].includes(gameState)
  // const shouldShowChatButton = gameState === 'GAME_OVER' // Show chat button only during gameplay
  const shouldShowChatToggle = gameState === 'PLAYING'
  const shouldShowWalletButton = true // Always show wallet button

  // Define background opacity based on screen
  const getHeaderBackground = () => {
    // ... (getHeaderBackground function code remains the same)
  }

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 ${getHeaderBackground()} 
                 backdrop-blur-sm border-b border-white/10 px-4 py-3
                 transition-colors duration-300`}
      >
        <div className='max-w-7xl mx-auto flex justify-between items-center gap-4'>
          {/* Left section */}
          <div className='flex items-center gap-4'>
            {shouldShowVolumeControl && <VolumeControl />}
          </div>
          {/* Center section */}
          <div
            className={`transition-opacity duration-300 
                        ${shouldShowGameStats ? 'opacity-100' : 'opacity-0'}`}
          >
            {shouldShowGameStats && <GameStats />}
          </div>

          {/* Right section */}
          <div className='flex items-center gap-4'>
            {shouldShowChatButton && (
              <button
                onClick={toggleFullChat}
                className='h-12 px-4 flex items-center justify-center
                         bg-game-blue text-black rounded-sm hover:bg-white 
                         transition-colors duration-200'
              >
                <MessageSquare
                  size={20}
                  className='mr-2'
                />
                Chat
              </button>
            )}
            {shouldShowChatToggle && (
              <button
                onClick={toggleOverlay}
                className={`h-[48px] px-6 flex items-center justify-center
                border-2 transition-colors duration-200
                ${
                  !overlayVisible
                    ? 'border-game-blue bg-transparent text-game-blue hover:bg-game-blue hover:text-black'
                    : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'
                }
                transition-all duration-300`}
              >
                <MessageSquare size={20} />
              </button>
            )}

            {shouldShowWalletButton && (
              <>
                <div
                  className={`transition-opacity duration-300 
                           ${
                             gameState === 'INITIAL'
                               ? 'opacity-100 scale-110'
                               : 'opacity-80 hover:opacity-100'
                           }`}
                >
                  <StyledWalletButton>
                    <WalletMultiButton />
                  </StyledWalletButton>
                </div>
                {/* Add Profile Button */}
                <button
                  onClick={() => setShowAccount(true)}
                  className='h-[48px] px-6 flex items-center justify-center
          border-2 border-game-blue bg-transparent text-game-blue
          hover:bg-game-blue hover:text-black transition-colors duration-200'
                >
                  <User size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      {showAccount && <AccountScreen onClose={() => setShowAccount(false)} />}
    </>
  )
}

export default Header
