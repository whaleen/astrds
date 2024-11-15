// src/components/sound/VolumeControl.jsx
import React from 'react'
import { Volume2, Volume1, VolumeX, Settings } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { useSettingsPanelStore } from '@/stores/settingsPanelStore'

const VolumeControl = () => {
  const {
    volumes,
    setVolume,
    currentMusic, // New from audio service
  } = useAudio()

  const toggleSettingsPanel = useSettingsPanelStore((state) => state.toggle)

  // We need to maintain the mute state differently since it's managed differently
  // in the new audio system (through volume rather than a separate flag)
  const isMuted = volumes.master === 0

  // Helper to get appropriate volume icon
  const getVolumeIcon = () => {
    if (isMuted || volumes.master === 0) return VolumeX
    if (volumes.master < 0.5) return Volume1
    return Volume2
  }

  const VolumeIcon = getVolumeIcon()

  const handleMute = () => {
    setVolume('master', isMuted ? 0.5 : 0) // Toggle between muted and mid volume
  }

  const handleVolumeChange = (value) => {
    setVolume('master', value)
  }

  return (
    <div className='flex items-center gap-4'>
      <button
        onClick={handleMute}
        className='text-game-blue hover:text-white transition-colors'
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon size={20} />
      </button>

      <div className='w-24 flex items-center'>
        <input
          type='range'
          min='0'
          max='1'
          step='0.01'
          value={volumes.master}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className='w-full h-1 bg-game-blue/30 rounded-lg appearance-none 
                   cursor-pointer opacity-70 hover:opacity-100 transition-opacity
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:bg-game-blue
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:hover:bg-white
                   [&::-webkit-slider-thumb]:transition-colors'
        />
      </div>

      <button
        onClick={toggleSettingsPanel}
        className='text-game-blue hover:text-white transition-colors'
        title='Sound Settings'
      >
        <Settings size={20} />
      </button>

      {/* Optional: Display current music track for debugging */}
      {currentMusic && (
        <div className='text-xs text-white/50'>Now Playing: {currentMusic}</div>
      )}
    </div>
  )
}

export default VolumeControl
