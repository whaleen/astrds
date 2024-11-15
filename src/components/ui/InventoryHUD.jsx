// src/components/ui/InventoryHUD.jsx
import React, { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useAudioStore } from '../../stores/audioStore'

// SVG Icons as components
const ShipIcon = () => (
  <svg
    viewBox='0 0 24 24'
    className='w-6 h-6 text-game-blue'
  >
    <path
      fill='currentColor'
      d='M12 2L4 14l1.2 1.6L12 13l6.8 2.6L20 14z'
    />
    <path
      fill='currentColor'
      d='M12 13v7l-3-2v-3.5zm0 0v7l3-2v-3.5z'
      opacity='0.8'
    />
  </svg>
)

const TokenIcon = () => (
  <svg
    viewBox='0 0 24 24'
    className='w-6 h-6 text-game-blue'
  >
    <circle
      cx='12'
      cy='12'
      r='10'
      stroke='currentColor'
      fill='none'
      strokeWidth='2'
    />
    <path
      d='M12 6v12M8 12h8'
      stroke='currentColor'
      strokeWidth='2'
    />
  </svg>
)

const PillIcon = () => (
  <svg
    viewBox='0 0 24 24'
    className='w-6 h-6 text-game-blue'
  >
    <path
      fill='currentColor'
      d='M4.22 11.29l7.07-7.07a6 6 0 018.48 8.48l-7.07 7.07a6 6 0 11-8.48-8.48zm1.41 1.42a4 4 0 005.66 5.66l7.07-7.07a4 4 0 00-5.66-5.66l-7.07 7.07z'
    />
  </svg>
)

const ItemCounter = ({
  icon,
  count,
  max,
  label,
  description,
  onClick,
  disabled,
  cooldown,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const playSound = useAudioStore((state) => state.playSound)

  const handleClick = () => {
    if (!disabled && count > 0 && !cooldown) {
      setIsAnimating(true)
      playSound('collect')
      onClick()
      setTimeout(() => setIsAnimating(false), 200)
    }
  }

  return (
    <div
      className='relative group'
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={handleClick}
        disabled={disabled || count === 0 || cooldown}
        className={`
          flex items-center gap-2 bg-black/50 px-3 py-2 rounded
          transition-all duration-200 relative overflow-hidden
          ${
            disabled || count === 0
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-game-blue/20 cursor-pointer'
          }
          ${isAnimating ? 'animate-[pulse_0.2s_ease-in-out]' : ''}
        `}
      >
        <div
          className={`w-8 h-8 flex items-center justify-center transition-transform duration-200
            ${isAnimating ? 'scale-125' : ''}`}
        >
          {icon}
        </div>
        <span
          className={`text-xl font-arcade text-white transition-all duration-200
            ${isAnimating ? 'text-game-blue scale-110' : ''}`}
        >
          ×{count}
        </span>

        {cooldown && (
          <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
            <span className='text-sm text-white/80'>
              {Math.ceil(cooldown / 1000)}s
            </span>
          </div>
        )}
      </button>

      {showTooltip && (
        <div className='absolute bottom-full left-0 mb-2 w-48 bg-black/90 rounded overflow-hidden'>
          <div className='px-3 py-2 bg-game-blue/20'>
            <span className='text-sm font-bold text-game-blue'>
              {label} ({count}/{max})
            </span>
          </div>
          <div className='px-3 py-2 text-xs text-white/80'>{description}</div>
          {disabled && (
            <div className='px-3 py-1 bg-red-500/20 text-xs text-red-300'>
              Not available in current state
            </div>
          )}
          {cooldown && (
            <div className='px-3 py-1 bg-yellow-500/20 text-xs text-yellow-300'>
              On cooldown: {Math.ceil(cooldown / 1000)}s
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const InventoryHUD = () => {
  const [cooldowns, setCooldowns] = useState({
    ships: 0,
    tokens: 0,
    pills: 0,
  })

  // Store state selectors
  const gameState = useGameStore((state) => state.gameState)
  const items = useInventoryStore((state) => state.items)
  const addItem = useInventoryStore((state) => state.addItem)
  const useItem = useInventoryStore((state) => state.useItem)

  const startCooldown = (itemType, duration) => {
    setCooldowns((prev) => ({ ...prev, [itemType]: duration }))
    const timer = setInterval(() => {
      setCooldowns((prev) => {
        const newCooldown = Math.max(0, prev[itemType] - 100)
        if (newCooldown === 0) clearInterval(timer)
        return { ...prev, [itemType]: newCooldown }
      })
    }, 100)
  }

  const handleUseItem = (itemType) => {
    if (items[itemType] > 0 && !cooldowns[itemType]) {
      const success = useItem(itemType)
      if (success) {
        // Different cooldowns for different items
        const cooldownDurations = {
          ships: 5000, // 5 seconds
          tokens: 3000, // 3 seconds
          pills: 10000, // 10 seconds
        }
        startCooldown(itemType, cooldownDurations[itemType])
      }
    }
  }

  const isGameActive = gameState === 'PLAYING'
  const isGameOver = gameState === 'GAME_OVER'

  return (
    <div className='fixed top-20 left-5 flex flex-col gap-2 z-10'>
      <ItemCounter
        icon={<ShipIcon />}
        count={items.ships}
        max={5}
        label='Extra Lives'
        description='Respawn after destruction. Use to add an extra life.'
        onClick={() => handleUseItem('ships')}
        disabled={!isGameActive}
        cooldown={cooldowns.ships}
      />

      <ItemCounter
        icon={<TokenIcon />}
        count={items.tokens}
        max={99}
        label='Continue Tokens'
        description='Continue game after Game Over. Keeps your score!'
        onClick={() => handleUseItem('tokens')}
        disabled={!isGameOver}
        cooldown={cooldowns.tokens}
      />

      <ItemCounter
        icon={<PillIcon />}
        count={items.pills}
        max={99}
        label='Power Pills'
        description='Temporary invincibility and increased firepower.'
        onClick={() => handleUseItem('pills')}
        disabled={!isGameActive}
        cooldown={cooldowns.pills}
      />
    </div>
  )
}

export default InventoryHUD
