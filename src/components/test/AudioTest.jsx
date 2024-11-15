// src/components/test/AudioTest.jsx
import React, { useState } from 'react'
import { useAudioStore } from '../../stores/audioStore'
import { useAudio } from '../../hooks/useAudio'
import {
  SOUND_TYPES,
  MUSIC_TRACKS,
  EFFECT_LEVELS,
} from '../../services/audio/AudioTypes'

const AudioTest = () => {
  const [activeSystem, setActiveSystem] = useState('old')

  // Old system
  const oldSystem = useAudioStore()

  // New system
  const {
    playSound,
    playMusic,
    stopMusic,
    transitionMusic,
    volumes,
    setVolume,
    effectSettings,
    setEffectSetting,
    currentMusic,
    isInitialized,
  } = useAudio()

  const handlePlaySound = (soundType) => {
    if (activeSystem === 'old') {
      oldSystem.playSound(soundType)
    } else {
      playSound(soundType)
    }
  }

  const handlePlayMusic = (trackId) => {
    if (activeSystem === 'old') {
      oldSystem.playMusic(trackId)
    } else {
      playMusic(trackId, { fadeIn: true })
    }
  }

  const handleStopMusic = (trackId) => {
    if (activeSystem === 'old') {
      oldSystem.stopMusic(trackId)
    } else {
      stopMusic(trackId, { fadeOut: true })
    }
  }

  const handleVolumeChange = (channel, value) => {
    if (activeSystem === 'old') {
      oldSystem.setVolume(channel, value)
    } else {
      setVolume(channel, value)
    }
  }

  if (!isInitialized) {
    return <div>Initializing new audio system...</div>
  }

  return (
    <div className='fixed bottom-4 right-4 p-4 bg-black/90 border border-game-blue max-h-[80vh] overflow-y-auto z-50'>
      <div className='text-game-blue mb-4'>Audio System Test Panel</div>

      {/* System Selection */}
      <div className='mb-6'>
        <label className='block text-sm mb-2'>Active System:</label>
        <div className='flex gap-4'>
          <button
            onClick={() => setActiveSystem('old')}
            className={`px-3 py-1 border ${
              activeSystem === 'old'
                ? 'border-game-blue bg-game-blue/20 text-white'
                : 'border-white/20 text-white/60 hover:border-white/40'
            }`}
          >
            Old System
          </button>
          <button
            onClick={() => setActiveSystem('new')}
            className={`px-3 py-1 border ${
              activeSystem === 'new'
                ? 'border-game-blue bg-game-blue/20 text-white'
                : 'border-white/20 text-white/60 hover:border-white/40'
            }`}
          >
            New System
          </button>
        </div>
      </div>

      {/* Sound Effects */}
      <div className='mb-6'>
        <div className='text-sm mb-2'>Sound Effects:</div>
        <div className='grid grid-cols-2 gap-2'>
          {Object.entries(SOUND_TYPES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handlePlaySound(value)}
              className='px-3 py-2 bg-game-blue/20 hover:bg-game-blue/30 text-game-blue text-sm'
            >
              Test {key.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Music Controls */}
      <div className='mb-6'>
        <div className='text-sm mb-2'>Music Tracks:</div>
        <div className='space-y-2'>
          {Object.entries(MUSIC_TRACKS).map(([key, value]) => (
            <div
              key={key}
              className='flex gap-2'
            >
              <button
                onClick={() => handlePlayMusic(value)}
                className='flex-1 px-3 py-2 bg-game-blue/20 hover:bg-game-blue/30 text-game-blue text-sm'
              >
                Play {key}
              </button>
              <button
                onClick={() => handleStopMusic(value)}
                className='px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm'
              >
                Stop
              </button>
            </div>
          ))}
        </div>
        {currentMusic && (
          <div className='mt-2 text-xs text-white/60'>
            Currently playing: {currentMusic}
          </div>
        )}
      </div>

      {/* Volume Controls */}
      <div className='mb-6'>
        <div className='text-sm mb-2'>Volume Controls:</div>
        <div className='space-y-2'>
          {Object.entries(volumes).map(([channel, value]) => (
            <div
              key={channel}
              className='flex items-center gap-2'
            >
              <label className='text-xs w-16'>{channel}:</label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.1'
                value={
                  activeSystem === 'old' ? oldSystem.volumes[channel] : value
                }
                onChange={(e) =>
                  handleVolumeChange(channel, parseFloat(e.target.value))
                }
                className='flex-1'
              />
              <span className='text-xs w-12 text-right'>
                {Math.round(value * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Effect Level Settings */}
      <div className='mb-6'>
        <div className='text-sm mb-2'>Effect Levels:</div>
        <div className='grid gap-2'>
          {Object.entries(effectSettings || {}).map(([effect, level]) => (
            <div
              key={effect}
              className='flex items-center gap-2'
            >
              <label className='text-xs w-24'>{effect}:</label>
              <select
                value={level}
                onChange={(e) => setEffectSetting(effect, e.target.value)}
                className='bg-black border border-white/20 text-white/80 text-xs px-2 py-1'
              >
                {Object.values(EFFECT_LEVELS).map((level) => (
                  <option
                    key={level}
                    value={level}
                  >
                    {level}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      <div className='mt-4 pt-4 border-t border-white/10 text-xs text-white/60'>
        <div>Active: {activeSystem} system</div>
        <div>Old Volumes: {JSON.stringify(oldSystem.volumes)}</div>
        <div>New Volumes: {JSON.stringify(volumes)}</div>
        {currentMusic && <div>Current Music: {currentMusic}</div>}
      </div>
    </div>
  )
}

export default AudioTest
