// src/screens/game/components/InventoryHUD.jsx
import React, { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { ShipIcon, TokenIcon, PillIcon } from '@/components/icons/GameIcons'

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

  const handleClick = () => {
    if (!disabled && count > 0 && !cooldown) {
      setIsAnimating(true)
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

  const gameState = useGameStore((state) => state.gameState)
  const items = useInventoryStore((state) => state.items)
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
        const cooldownDurations = {
          ships: 5000,
          tokens: 3000,
          pills: 10000,
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
