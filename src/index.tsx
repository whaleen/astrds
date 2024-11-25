// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/style.css';

// Import wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

const container = document.getElementById('root');
const root = createRoot(container);

// Render app directly - wallet configuration is handled in App.tsx
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
