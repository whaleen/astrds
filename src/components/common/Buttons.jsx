// src/components/common/Buttons.jsx
import React from 'react'

export const BaseButton = ({
  children,
  onClick,
  disabled,
  variant = 'default',
  loading = false,
  className = '',
}) => {
  const variants = {
    quarter: `bg-transparent border-2 border-game-green text-game-green 
              hover:bg-game-green hover:text-black hover:shadow-[0_0_15px_#4dff4d]`,
    red: `bg-transparent border-2 border-game-red text-game-red 
              hover:bg-game-red hover:text-black hover:shadow-[0_0_15px_#ff4d4d]`,
    chat: `bg-transparent border-2 border-game-blue text-game-blue 
           hover:bg-game-blue hover:text-black hover:shadow-[0_0_15px_#4dc1f9]`,
    default: `bg-transparent border-2 border-game-green text-game-green 
              hover:bg-game-green hover:text-black hover:shadow-[0_0_15px_#4dff4d]`,
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        font-arcade px-8 py-4 text-base cursor-pointer 
        transition-all duration-300 uppercase relative overflow-hidden
        disabled:bg-neutral-800 disabled:border-neutral-800 
        disabled:text-neutral-600 disabled:cursor-not-allowed 
        disabled:hover:shadow-none
        ${variants[variant]}
        ${loading ? 'pr-12' : ''}
        ${className}
      `}
    >
      {children}
      {loading && (
        <span
          className='absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 
                        bg-current rounded-full animate-[blink_1s_infinite]'
        />
      )}
    </button>
  )
}

export const QuarterButton = (props) => (
  <BaseButton
    variant='quarter'
    {...props}
  >
    {props.children || 'Insert Quarter'}
  </BaseButton>
)

export const ChatButton = (props) => (
  <BaseButton
    variant='chat'
    {...props}
  >
    {props.children || 'CHAT'}
  </BaseButton>
)

export const StyledWalletButton = ({ children }) => (
  <div
    className='[&>.wallet-adapter-button]:bg-transparent
                  [&>.wallet-adapter-button]:border-2 
                  [&>.wallet-adapter-button]:border-game-blue 
                  [&>.wallet-adapter-button]:text-game-blue 
                  [&>.wallet-adapter-button]:font-arcade 
                  [&>.wallet-adapter-button]:px-6 
                  [&>.wallet-adapter-button]:py-3 
                  [&>.wallet-adapter-button]:text-sm 
                  [&>.wallet-adapter-button]:transition-all 
                  [&>.wallet-adapter-button]:duration-300
                  [&>.wallet-adapter-button:hover]:bg-game-blue 
                  [&>.wallet-adapter-button:hover]:text-black 
                  [&>.wallet-adapter-button:hover]:shadow-[0_0_10px_#4dc1f9]
                  [&>.wallet-adapter-button:not(:disabled):hover]:bg-game-blue'
  >
    {children}
  </div>
)
