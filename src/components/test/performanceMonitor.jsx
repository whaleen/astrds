import React, { useState, useEffect, useRef } from 'react'
import { useEngineStore } from '@/stores/engineStore'

// Track FPS and frame time to identify performance drops
// Monitor entity counts to spot potential entity management issues
// Watch memory usage to detect memory leaks
// See real-time impact of any optimizations we make

// The monitor shows basic metrics by default and can be expanded to show more detailed information. Red values indicate potential performance issues:

// FPS below 50
// Frame time above 16.67ms (required for 60fps)

const PerformanceMonitor = () => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTime: 0,
    entityCounts: {
      asteroids: 0,
      bullets: 0,
      particles: 0,
      pills: 0,
      tokens: 0,
    },
    memory: 0,
  })

  const frameTimestamps = useRef([])
  const lastUpdate = useRef(performance.now())

  useEffect(() => {
    let frameId

    const measure = () => {
      const now = performance.now()
      const deltaTime = now - lastUpdate.current
      lastUpdate.current = now

      // Track frame timestamps for FPS calculation
      frameTimestamps.current.push(now)
      // Keep only last second of frames
      while (frameTimestamps.current[0] < now - 1000) {
        frameTimestamps.current.shift()
      }

      // Get current entity counts from engine store
      const entities = useEngineStore.getState().entities

      setMetrics((prev) => ({
        fps: frameTimestamps.current.length,
        frameTime: Math.round(deltaTime * 100) / 100,
        entityCounts: {
          asteroids: entities.asteroids.length,
          bullets: entities.bullets.length,
          particles: entities.particles.length,
          pills: entities.pills.length,
          tokens: entities.tokens.length,
        },
        memory:
          Math.round(performance.memory?.usedJSHeapSize / (1024 * 1024)) || 0,
      }))

      frameId = requestAnimationFrame(measure)
    }

    measure()
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div className='fixed left-4 bottom-4 z-50'>
      <div
        className={`
        bg-black/80 border border-game-blue rounded-lg p-4
        transition-all duration-200
        ${isExpanded ? 'w-64' : 'w-32'}
      `}
      >
        {/* Header */}
        <div className='flex justify-between items-center mb-2'>
          <h3 className='text-sm text-game-blue'>Performance</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='text-xs text-gray-400 hover:text-white'
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Basic Metrics */}
        <div className='space-y-1'>
          <div
            className={`flex justify-between items-center
            ${metrics.fps < 50 ? 'text-red-400' : 'text-green-400'}`}
          >
            <span className='text-xs'>FPS</span>
            <span className='font-mono'>{metrics.fps}</span>
          </div>

          <div
            className={`flex justify-between items-center
            ${metrics.frameTime > 16.67 ? 'text-red-400' : 'text-green-400'}`}
          >
            <span className='text-xs'>Frame Time</span>
            <span className='font-mono'>{metrics.frameTime}ms</span>
          </div>
        </div>

        {/* Expanded Metrics */}
        {isExpanded && (
          <>
            <div className='mt-4 pt-4 border-t border-white/10'>
              <h4 className='text-xs text-gray-400 mb-2'>Entity Count</h4>
              <div className='space-y-1'>
                {Object.entries(metrics.entityCounts).map(([type, count]) => (
                  <div
                    key={type}
                    className='flex justify-between items-center'
                  >
                    <span className='text-xs text-gray-400'>{type}</span>
                    <span className='font-mono text-white'>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {metrics.memory > 0 && (
              <div className='mt-4 pt-4 border-t border-white/10'>
                <div className='flex justify-between items-center'>
                  <span className='text-xs text-gray-400'>Memory</span>
                  <span className='font-mono text-white'>
                    {metrics.memory}MB
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PerformanceMonitor
