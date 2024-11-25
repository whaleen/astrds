// src/screens/game/components/GameHUD.tsx
import React, { useState } from 'react'
import { useGameData } from '@/stores/gameData'
import { useStateMachine } from '@/stores/stateMachine'
import { useLevelStore } from '@/stores/levelStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { usePowerupStore } from '@/stores/powerupStore'
import { ShipIcon, TokenIcon, PillIcon } from '@/components/icons/GameIcons'
import { Shield, Zap } from 'lucide-react'
import { MachineState } from '@/types/machine'

interface PowerupIndicatorProps {
  name: string
  active: boolean
  icon: React.ReactNode
}

const PowerupIndicator: React.FC<PowerupIndicatorProps> = ({ name, active, icon }) => {
  if (!active) return null

  return (
    <div className='flex items-center gap-2 bg-game-blue/20 px-3 py-1 rounded'>
      <div className='text-game-blue'>{icon}</div>
      <span className='text-sm text-white/80'>
        {name.charAt(0).toUpperCase() + name.slice(1)} Active
      </span>
    </div>
  )
}

interface CooldownIndicatorProps {
  duration: number
  remaining: number
}

const CooldownIndicator: React.FC<CooldownIndicatorProps> = ({
  duration,
  remaining
}) => {
  const progress = Math.max(0, Math.min(1, remaining / duration))

  return (
    <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
      <div
        className='absolute inset-0 bg-game-blue/20'
        style={{ transform: `scaleY(${progress})`, transformOrigin: 'bottom' }}
      />
      <span className='text-sm text-white/80 relative'>
        {Math.ceil(remaining / 1000)}s
      </span>
    </div>
  )
}

interface InventoryItemProps {
  type: 'ships' | 'tokens' | 'pills'
  count: number
  max: number
  label: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  cooldown?: number
}

const InventoryItem: React.FC<InventoryItemProps> = ({
  count,
  max,
  label,
  description,
  icon,
  onClick,
  disabled = false,
  cooldown = 0
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className='relative group'
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={onClick}
        disabled={disabled || count === 0 || cooldown > 0}
        className={`
          flex items-center gap-2 bg-black/50 px-3 py-2 rounded
          transition-all duration-200 relative overflow-hidden
          ${disabled || count === 0
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-game-blue/20 cursor-pointer'
          }
        `}
      >
        <div className='w-8 h-8 flex items-center justify-center'>
          {icon}
        </div>
        <span className='text-xl font-arcade text-white'>×{count}</span>

        {cooldown > 0 && (
          <CooldownIndicator
            duration={cooldown}
            remaining={cooldown}
          />
        )}
      </button>

      {showTooltip && (
        <div className='absolute bottom-full left-0 mb-2 w-48 bg-black/90 rounded overflow-hidden'>
          <div className='px-3 py-2 bg-game-blue/20'>
            <span className='text-sm font-bold text-game-blue'>
              {label} ({count}/{max})
            </span>
          </div>
          <div className='px-3 py-2 text-xs text-white/80'>
            {description}
          </div>
        </div>
      )}
    </div>
  )
}

export const GameHUD: React.FC = () => {
  const [cooldowns, setCooldowns] = useState({
    ships: 0,
    tokens: 0,
    pills: 0,
  })

  // Game state subscriptions
  const currentState = useStateMachine((state) => state.currentState)
  const score = useGameData((state) => state.score)
  const topScore = useGameData((state) => state.topScore)
  const level = useLevelStore((state) => state.level)
  const items = useInventoryStore((state) => state.items)
  const useItem = useInventoryStore((state) => state.useItem)
  const powerups = usePowerupStore((state) => state.powerups)

  const handleUseItem = (itemType: keyof typeof items) => {
    if (items[itemType] > 0 && !cooldowns[itemType]) {
      const success = useItem(itemType)
      if (success) {
        const cooldownDurations = {
          ships: 5000,
          tokens: 3000,
          pills: 10000,
        }

        // Start cooldown
        setCooldowns(prev => ({
          ...prev,
          [itemType]: cooldownDurations[itemType]
        }))

        // Countdown timer
        const timer = setInterval(() => {
          setCooldowns(prev => {
            const newValue = Math.max(0, prev[itemType] - 100)
            if (newValue === 0) clearInterval(timer)
            return { ...prev, [itemType]: newValue }
          })
        }, 100)
      }
    }
  }

  const isGameActive = currentState === MachineState.PLAYING
  const isGameOver = currentState === MachineState.GAME_OVER

  return (
    <div className='fixed top-20 left-5 w-64'>
      {/* Game Stats Section */}
      <div className='bg-black/30 p-4 rounded-lg border border-game-blue/20 mb-4'>
        <div className='text-xl text-game-blue mb-2'>
          Score: {score.toLocaleString()}
        </div>
        <div className='text-sm text-white/50 mb-4'>
          Top: {topScore.toLocaleString()}
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center'>
            <div className='text-sm text-white/70'>Level</div>
            <div className='text-lg text-game-blue'>{level}</div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-white/70'>Ships</div>
            <div className='text-lg text-game-blue'>{items.ships}</div>
          </div>
        </div>
      </div>

      {/* Powerups Section */}
      {Object.entries(powerups).some(([_, active]) => active) && (
        <div className='bg-black/30 p-4 rounded-lg border border-game-blue/20 mb-4 space-y-2'>
          <PowerupIndicator
            name="Invincible"
            active={powerups.invincible}
            icon={<Shield size={16} />}
          />
          <PowerupIndicator
            name="Rapid Fire"
            active={powerups.rapidFire}
            icon={<Zap size={16} />}
          />
        </div>
      )}

      {/* Inventory Section */}
      <div className='bg-black/30 p-4 rounded-lg border border-game-blue/20 space-y-2'>
        <InventoryItem
          type="ships"
          count={items.ships}
          max={5}
          label="Extra Lives"
          description="Respawn after destruction"
          icon={<ShipIcon className='w-6 h-6' />}
          onClick={() => handleUseItem('ships')}
          disabled={!isGameActive}
          cooldown={cooldowns.ships}
        />

        <InventoryItem
          type="tokens"
          count={items.tokens}
          max={99}
          label="Continue Tokens"
          description="Continue game after Game Over"
          icon={<TokenIcon className='w-6 h-6' />}
          onClick={() => handleUseItem('tokens')}
          disabled={!isGameOver}
          cooldown={cooldowns.tokens}
        />

        <InventoryItem
          type="pills"
          count={items.pills}
          max={99}
          label="Power Pills"
          description="Temporary invincibility and firepower"
          icon={<PillIcon className='w-6 h-6' />}
          onClick={() => handleUseItem('pills')}
          disabled={!isGameActive}
          cooldown={cooldowns.pills}
        />
      </div>
    </div>
  )
}
