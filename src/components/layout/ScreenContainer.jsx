// src/components/layout/ScreenContainer.jsx
import React from 'react'
// import bgImage from '/public/game-screen-bg.jpg'
import bgImage from '/assets/joi.gif'

const ScreenContainer = ({ children, className = '' }) => {
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-40 ${className}`}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className='bg-black/75 border border-game-blue p-8 max-w-2xl w-full mx-4'>
        {children}
      </div>
    </div>
  )
}

export default ScreenContainer
