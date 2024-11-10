import React, { useState } from 'react'
import { soundManager } from '../sounds/SoundManager'
const VolumeControl = () => {
  const [volume, setVolume] = useState(0.5)

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    soundManager.setVolume(newVolume)
  }

  return (
    <div className='volume-control'>
      <input
        type='range'
        min='0'
        max='1'
        step='0.1'
        value={volume}
        onChange={handleVolumeChange}
        className='volume-slider'
      />
    </div>
  )
}

export default VolumeControl
