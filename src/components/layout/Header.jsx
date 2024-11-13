import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MessageSquare } from 'lucide-react'
import VolumeControl from '../VolumeControl'
// import { useGame } from '../../hooks/useGame'
import { StyledWalletButton, ChatButton } from '../ui/Buttons'
import { useChatStore } from '../../stores/chatStore'

const Header = () => {
  const { overlayVisible, toggleOverlay, toggleFullChat } = useChatStore()

  // What do we do with this now?
  // const { state, actions } = useGame()

  const handleToggleOverlay = () => {
    toggleOverlay()
  }

  const handleToggleFullChat = () => {
    toggleFullChat()
  }

  return (
    <header className='fixed top-0 w-full z-50 p-5 flex justify-between items-center'>
      <div className='flex items-center space-x-4'>
        <VolumeControl />
      </div>
      <ChatButton onClick={handleToggleFullChat} />
      <div className='flex items-center space-x-4'>
        <button
          onClick={handleToggleOverlay}
          className={`p-2 rounded transition-colors duration-200
            ${
              overlayVisible
                ? 'bg-game-blue/20 text-game-blue'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          title={overlayVisible ? 'Hide Chat' : 'Show Chat'}
        >
          <MessageSquare size={16} />
        </button>
        <div className='opacity-70 hover:opacity-100 transition-opacity'>
          <StyledWalletButton>
            <WalletMultiButton />
          </StyledWalletButton>
        </div>
      </div>
    </header>
  )
}

export default Header
