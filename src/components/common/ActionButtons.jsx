// src/components/common/ActionButtons.jsx
import React from 'react'

const ActionButtons = ({ children, className = '' }) => (
  <div className={`flex flex-col gap-4 items-center ${className}`}>
    {children}
  </div>
)

export default ActionButtons
