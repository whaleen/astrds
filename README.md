# Solana Asteroids

A Web3-enabled remake of the classic Asteroids arcade game, built with React and integrated with Solana blockchain functionality. This game combines retro arcade gaming with modern web3 features, including wallet authentication and blockchain-based high score tracking.

## Features

### Game Mechanics

- Classic Asteroids gameplay with modern graphics
- Ship controls using WASD or arrow keys
- Shooting mechanics using spacebar
- Physics-based movement and collisions
- Particle effects for explosions and thrusters
- Progressive difficulty with increasing asteroid count
- Score tracking based on asteroid destruction

### Web3 Integration

- Solana wallet connection using Phantom Wallet
- "Insert Quarter" mechanic using wallet signatures
- Wallet authentication required to start game
- Devnet connection for testing

### Audio System

- Dynamic sound effects for:
  - Shooting
  - Thrusters
  - Explosions
  - Quarter insertion
- Volume control system
- Background music during gameplay

### High Score System (In Development)

- Persistent leaderboard using Netlify Blob Storage
- Top 10 scores tracking
- Player identification via wallet address
- Score submission on game over
- Real-time leaderboard updates

## Technical Architecture

### Frontend

- React for UI components
- Vite for build system and development server
- Canvas-based game rendering
- Custom game loop implementation
- Responsive design for different screen sizes

### Blockchain Integration

- Solana Web3.js for blockchain interactions
- Wallet adapter integration
- Message signing for game authentication

### Backend (Serverless)

- Netlify Functions for backend logic
- Netlify Blob Storage for score persistence
- CORS-enabled API endpoints
- Serverless function architecture

### Project Structure

```
.
├── netlify/
│   ├── blobs/         # Blob storage configuration
│   └── functions/     # Serverless functions
├── public/
│   └── sounds/        # Game audio assets
└── src/
    ├── components/    # React components
    ├── api/           # API integrations
    ├── helpers/       # Utility functions
    └── sounds/        # Audio management
```

## Current Development Status

### Completed Features

- Basic game mechanics and controls
- Solana wallet integration
- Sound system implementation
- Score tracking during gameplay
- Wallet signature authentication
- Basic UI/UX implementation

### In Progress

- High score system using Netlify Blobs
- Leaderboard component
- Score persistence between sessions
- Function testing infrastructure

### Planned Features

- Global leaderboard
- Social sharing of high scores
- Additional game modes
- Power-ups and special abilities
- Mobile-responsive controls
- Achievement system

## Development

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Test serverless functions
pnpm exec netlify functions:invoke getScores
pnpm exec netlify functions:invoke postScore --payload '{"score": 1000, "walletAddress": "TEST_WALLET"}'
```

### Environment Setup

Required environment variables:

- `BLOB_READ_WRITE_TOKEN`: For Netlify Blob Storage access
- Other environment variables are managed through Netlify's dashboard

### Testing

- Local function testing via Netlify CLI
- Blob storage integration testing
- Frontend component testing

## Deployment

- Automated deployment via Netlify
- Continuous integration with GitHub
- Environment variable management through Netlify
- Function and blob storage configuration via `netlify.toml`

## Technical Requirements

- Node.js 18+
- pnpm package manager
- Phantom Wallet browser extension
- Modern web browser with canvas support

## Known Issues & Future Improvements

1. Score persistence during function cold starts
2. Local development environment setup
3. Function testing infrastructure
4. Mobile device optimization
5. Additional game features and power-ups

## Contributing

Currently in active development. Contributions and suggestions are welcome for:

- Game mechanics improvements
- Web3 integration enhancements
- Performance optimizations
- Additional feature suggestions

## License

TBD

---

_Note: This project is currently under active development. Features and implementations may change._
