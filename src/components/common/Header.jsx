// src/components/common/Header.jsx
import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MessageSquare, User, Trophy, Coins } from 'lucide-react'
import { StyledWalletButton } from './StyledComponents'
import { useOverlayStore, OVERLAY_TYPES } from '../overlay/OverlayManager'
import VolumeControl from '../sound/VolumeControl'
import { ShipIcon } from '@/components/icons/GameIcons'

const HeaderButton = ({ icon: Icon, label, overlayType, shortcut }) => {
  const { isOverlayActive, openOverlay } = useOverlayStore()
  const isSelected = isOverlayActive(overlayType)

  return (
    <button
      onClick={() => openOverlay(overlayType)}
      className={`
        h-12 px-4 flex items-center justify-center gap-2 rounded-sm
        transition-colors duration-200
        ${
          isSelected
            ? 'bg-game-blue text-black'
            : 'border-2 border-game-blue text-game-blue hover:bg-game-blue hover:text-black'
        }
      `}
      title={`${label} [${shortcut.toUpperCase()}]`}
    >
      <Icon size={20} />
      <span className='hidden md:inline'>{label}</span>
    </button>
  )
}

const Header = () => {
  return (
    <header className='fixed top-0 w-full z-50 backdrop-blur-sm border-b border-white/10 px-4 py-3'>
      <div className='max-w-7xl mx-auto flex justify-between items-center gap-4'>
        {/* Left section */}
        <div className='flex items-center gap-4'>
          {/* <button
            onClick={() => {}}
            className='text-white hover:text-white transition-colors duration-200 p-2'
            title='Return to Title Screen'
          >
            <ShipIcon className='w-8 h-8' />
          </button> */}
          <VolumeControl />
        </div>

        {/* Right section */}
        <div className='flex items-center gap-4'>
          <HeaderButton
            icon={Coins}
            label='Tokenomics'
            overlayType={OVERLAY_TYPES.TOKENOMICS}
            shortcut='t'
          />
          <HeaderButton
            icon={MessageSquare}
            label='Chat'
            overlayType={OVERLAY_TYPES.CHAT}
            shortcut='f'
          />
          <HeaderButton
            icon={Trophy}
            label='Leaderboard'
            overlayType={OVERLAY_TYPES.LEADERBOARD}
            shortcut='l'
          />
          <HeaderButton
            icon={User}
            label='Account'
            overlayType={OVERLAY_TYPES.ACCOUNT}
            shortcut='a'
          />

          <StyledWalletButton>
            <WalletMultiButton />
          </StyledWalletButton>
        </div>
      </div>
    </header>
  )
}

export default Header
