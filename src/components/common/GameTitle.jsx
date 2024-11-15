// src/components/common/GameTitle.jsx
import React from 'react'

const GameTitle = () => (
  <>
    <h1
      className='text-4xl md:text-5xl mb-10 uppercase text-center leading-tight
                 text-white animate-[glow_1.5s_ease-in-out_infinite_alternate]
                 [text-shadow:0_0_10px_#4dc1f9,0_0_20px_#4dc1f9,0_0_30px_#4dc1f9]'
    >
      Solana Asteroids
    </h1>
    <h2
      className='text-2xl md:text-xl mb-10 uppercase text-center leading-tight
                 text-white animate-[glow_1.5s_ease-in-out_infinite_alternate]
                 [text-shadow:0_0_10px_#4dc1f9,0_0_20px_#4dc1f9,0_0_30px_#4dc1f9]'
    >
      Blade Runner Edition
    </h2>
  </>
)

export default GameTitle
