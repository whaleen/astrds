// src/components/VolumeControl.jsx
import React from 'react'
import { useAudioStore } from '../stores/audioStore'

const VolumeControl = () => {
  const volume = useAudioStore((state) => state.volume)
  const setVolume = useAudioStore((state) => state.setVolume)

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  return (
    <div className='flex items-center mx-5'>
      <input
        type='range'
        min='0'
        max='1'
        step='0.1'
        value={volume}
        onChange={handleVolumeChange}
        className='w-24 h-1 bg-game-blue rounded-lg appearance-none cursor-pointer 
                  opacity-70 hover:opacity-100 transition-opacity
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4 
                  [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:bg-white 
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-moz-range-thumb]:w-4
                  [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-0'
      />
    </div>
  )
}

export default VolumeControl
