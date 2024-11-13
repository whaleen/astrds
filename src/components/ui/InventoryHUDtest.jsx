// src/components/ui/InventoryHUD.jsx
import React from 'react'
import { useInventoryStore } from '../../stores/inventoryStore'

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
  const [showTooltip, setShowTooltip] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

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
          className={`w-8 h-8 flex items-center justify-center transition-transform duration-200 ${
            isAnimating ? 'scale-125' : ''
          }`}
        >
          {icon}
        </div>
        <span
          className={`text-xl font-arcade text-white transition-all duration-200 ${
            isAnimating ? 'text-game-blue scale-110' : ''
          }`}
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

const InventoryHUDTest = () => {
  const items = useInventoryStore((state) => state.items)
  const addItem = useInventoryStore((state) => state.addItem)
  const useItem = useInventoryStore((state) => state.useItem)
  const [cooldowns, setCooldowns] = React.useState({
    ships: 0,
    tokens: 0,
    pills: 0,
  })

  // Test function to add items
  const handleAddItem = (itemType) => {
    if (itemType === 'ships') {
      // Get the game screen component's spawnShipPickup function
      const gameScreen = document.querySelector('canvas')?.__gameScreen
      if (gameScreen?.spawnShipPickup) {
        gameScreen.spawnShipPickup()
      }
    }
    addItem(itemType, 1)
  }

  const handleUseItem = (itemType) => {
    if (items[itemType] > 0 && !cooldowns[itemType]) {
      useItem(itemType)
      // Add cooldown
      setCooldowns((prev) => ({ ...prev, [itemType]: 5000 }))
      // Start cooldown timer
      const timer = setInterval(() => {
        setCooldowns((prev) => {
          const newValue = Math.max(0, prev[itemType] - 100)
          if (newValue === 0) clearInterval(timer)
          return { ...prev, [itemType]: newValue }
        })
      }, 100)
    }
  }

  return (
    <div className='fixed top-20 right-5 flex flex-col gap-2 z-10'>
      <ItemCounter
        icon={<div>🚀</div>}
        count={items.ships}
        max={5}
        label='Ships'
        description='Extra lives for your ship'
        onClick={() => handleUseItem('ships')}
        cooldown={cooldowns.ships}
      />
      <ItemCounter
        icon={<div>🎮</div>}
        count={items.tokens}
        max={99}
        label='Tokens'
        description='Continue tokens'
        onClick={() => handleUseItem('tokens')}
        cooldown={cooldowns.tokens}
      />
      <ItemCounter
        icon={<div>💊</div>}
        count={items.pills}
        max={99}
        label='Pills'
        description='Power-up pills'
        onClick={() => handleUseItem('pills')}
        cooldown={cooldowns.pills}
      />

      {/* Test buttons */}
      <div className='mt-4 space-y-2'>
        <button
          onClick={() => handleAddItem('ships')}
          className='w-full px-3 py-2 bg-game-blue/20 text-game-blue rounded hover:bg-game-blue/30'
        >
          Add Ship
        </button>
        <button
          onClick={() => handleAddItem('tokens')}
          className='w-full px-3 py-2 bg-game-blue/20 text-game-blue rounded hover:bg-game-blue/30'
        >
          Add Token
        </button>
        <button
          onClick={() => handleAddItem('pills')}
          className='w-full px-3 py-2 bg-game-blue/20 text-game-blue rounded hover:bg-game-blue/30'
        >
          Add Pill
        </button>
      </div>
    </div>
  )
}

export default InventoryHUDTest
