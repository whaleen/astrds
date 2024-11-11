// src/SolanaAsteroids.jsx
import React, { Component } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection } from '@solana/web3.js'
import Ship from './components/Ship'
import Asteroid from './components/Asteroid'
import { randomNumBetweenExcluding } from './helpers/helpers'
import { verifyWalletSignature } from './auth'
import VolumeControl from './components/VolumeControl'
import { soundManager } from './sounds/SoundManager'
import { submitScore } from './api/scores'
import Leaderboard from './components/Leaderboard'
import {
  StyledWalletButton,
  StartButton,
  Controls,
  GameOver,
  Score,
  AuthContainer as BaseAuthContainer,
  GameHeader as BaseGameHeader,
} from './components/ui/StyledComponents'
import Chat from './components/Chat'

const KEY = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32,
}

// Wallet wrapper component
export const SolanaAsteroidsWrapper = () => {
  const wallet = useWallet()
  return <SolanaAsteroids wallet={wallet} />
}

const AuthContainer = ({ children, title }) => (
  <div className='flex flex-col items-center justify-center min-h-screen bg-black relative z-10'>
    <h1
      className='text-4xl md:text-5xl mb-10 uppercase text-center leading-tight
                   text-white animate-[glow_1.5s_ease-in-out_infinite_alternate]
                   [text-shadow:0_0_10px_#4dc1f9,0_0_20px_#4dc1f9,0_0_30px_#4dc1f9]'
    >
      {title}
    </h1>
    <div className='flex flex-col items-center gap-6 text-center'>
      {children}
    </div>
  </div>
)

const GameHeaderContent = () => (
  <BaseGameHeader>
    <VolumeControl />
    <div className='opacity-70 hover:opacity-100 transition-opacity'>
      <StyledWalletButton>
        <WalletMultiButton />
      </StyledWalletButton>
    </div>
  </BaseGameHeader>
)

const GameInfo = ({ currentScore, topScore }) => (
  <>
    <Score className='absolute top-5 left-5 z-10'>Top Score: {topScore}</Score>
    <Score className='absolute top-15 left-5 z-10'>Score: {currentScore}</Score>
    <Controls>
      Use [A][S][W][D] or [←][↑][↓][→] to MOVE
      <br />
      Use [SPACE] to SHOOT
    </Controls>
  </>
)

const WalletWrapper = ({ children, loading }) => (
  <div className='flex flex-col items-center gap-6'>
    <div className='flex flex-col items-center gap-4'>{children}</div>
    {loading && (
      <div className='text-game-blue animate-pulse'>Processing...</div>
    )}
  </div>
)

export class SolanaAsteroids extends Component {
  // Constructor
  constructor(props) {
    super(props)
    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      context: null,
      keys: {
        left: 0,
        right: 0,
        up: 0,
        down: 0,
        space: 0,
      },
      asteroidCount: 3,
      currentScore: 0,
      topScore: localStorage['topscore'] || 0,
      inGame: false,
      isInitialized: false,
      gameState: 'INITIAL',
      signatureLoading: false,
      showLeaderboard: false,
      showChat: false,
    }

    this.canvasRef = React.createRef()
    this.ship = []
    this.asteroids = []
    this.bullets = []
    this.particles = []
  }

  // Add method to toggle chat
  toggleChat = () => {
    this.setState((prevState) => ({
      showChat: !prevState.showChat,
    }))
  }

  // Lifecycle methods
  componentDidMount() {
    window.addEventListener('keyup', this.handleKeys.bind(this, false))
    window.addEventListener('keydown', this.handleKeys.bind(this, true))
    window.addEventListener('resize', this.handleResize.bind(this, false))

    this.initializeGame()
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeys.bind(this, false))
    window.removeEventListener('keydown', this.handleKeys.bind(this, true))
    window.removeEventListener('resize', this.handleResize.bind(this, false))

    // Safely stop sounds
    try {
      if (soundManager) {
        soundManager.stopAll()
      }
    } catch (error) {
      console.warn('Error cleaning up sounds:', error)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Initialize game when canvas becomes available
    if (!prevState.isInitialized && this.canvasRef.current) {
      this.initializeGame()
    }

    // Handle wallet connection
    if (!prevProps.wallet.connected && this.props.wallet.connected) {
      this.handleWalletConnection()
    }

    // Ensure context when needed
    if (this.state.gameState === 'PLAYING' && !this.state.context) {
      this.ensureContext()
    }
  }

  // Event handlers
  handleWalletConnection = async () => {
    const { wallet } = this.props
    if (!wallet.connected) return

    this.setState({ gameState: 'READY_TO_PLAY' })
  }

  handleQuarterInsert = async () => {
    const { wallet } = this.props
    if (!wallet.connected) {
      console.error('Wallet not connected')
      return
    }

    this.setState({ signatureLoading: true })

    try {
      // Play quarter insert sound
      soundManager.play('quarterInsert')

      console.log('Initializing connection to Solana...')
      const connection = new Connection(
        'https://api.devnet.solana.com',
        'confirmed'
      )

      console.log('Requesting wallet signature...')
      const isVerified = await verifyWalletSignature(wallet, connection)
      console.log('Signature verification result:', isVerified)

      if (isVerified) {
        this.setState(
          {
            gameState: 'PLAYING',
            signatureLoading: false,
          },
          () => {
            soundManager.play('bgMusic')
            this.startGame()
          }
        )
      } else {
        console.error('Signature verification failed')
        this.setState({
          signatureLoading: false,
          gameState: 'READY_TO_PLAY',
        })
        // Add user feedback
        alert('Failed to verify wallet signature. Please try again.')
      }
    } catch (error) {
      console.error('Quarter insert failed:', error)
      this.setState({
        signatureLoading: false,
        gameState: 'READY_TO_PLAY',
      })
      // Add user feedback
      alert('Failed to process quarter insert. Please try again.')
    }
  }

  handleKeys(value, e) {
    let keys = this.state.keys
    if (e.keyCode === KEY.LEFT || e.keyCode === KEY.A) keys.left = value
    if (e.keyCode === KEY.RIGHT || e.keyCode === KEY.D) keys.right = value
    if (e.keyCode === KEY.UP || e.keyCode === KEY.W) keys.up = value
    if (e.keyCode === KEY.SPACE) keys.space = value
    this.setState({
      keys: keys,
    })
  }

  handleResize(value, e) {
    this.setState({
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    })
  }

  // Game logic methods
  initializeGame = () => {
    if (this.canvasRef.current && !this.state.isInitialized) {
      const context = this.canvasRef.current.getContext('2d')
      if (context) {
        this.setState({
          context: context,
          isInitialized: true,
        })
      }
    }
  }

  startGame() {
    // Initialize or re-initialize context
    const context = this.canvasRef.current?.getContext('2d')
    if (!context) {
      console.error('Could not get canvas context')
      return
    }

    // Reset all game objects
    this.ship = []
    this.asteroids = []
    this.bullets = []
    this.particles = []

    // Clear the entire canvas
    context.clearRect(
      0,
      0,
      this.state.screen.width * this.state.screen.ratio,
      this.state.screen.height * this.state.screen.ratio
    )

    // Set initial state with the new context
    this.setState(
      {
        context: context,
        inGame: true,
        currentScore: 0,
        asteroidCount: 3,
      },
      () => {
        // Only proceed if we have context
        if (!this.state.context) return

        // Create new ship
        let ship = new Ship({
          position: {
            x: this.state.screen.width / 2,
            y: this.state.screen.height / 2,
          },
          create: this.createObject.bind(this),
          onDie: this.gameOver.bind(this),
        })
        this.createObject(ship, 'ship')

        // Create new asteroids
        this.generateAsteroids(this.state.asteroidCount)

        // Start with clean black background
        this.state.context.save()
        this.state.context.scale(
          this.state.screen.ratio,
          this.state.screen.ratio
        )
        this.state.context.fillStyle = '#000'
        this.state.context.fillRect(
          0,
          0,
          this.state.screen.width,
          this.state.screen.height
        )
        this.state.context.restore()

        // Start the game loop
        requestAnimationFrame(() => this.update())
      }
    )
  }

  async gameOver() {
    soundManager.stop('bgMusic')
    soundManager.play('gameOver')

    if (this.state.currentScore > 0) {
      try {
        this.setState({ submittingScore: true })
        const highScores = await submitScore(
          this.state.currentScore,
          this.props.wallet.publicKey?.toString() || 'Anonymous'
        )
        this.setState({
          highScores,
          submittingScore: false,
        })
      } catch (error) {
        console.error('Failed to submit score:', error)
        this.setState({ submittingScore: false })
      }
    }

    this.cleanup()
    this.setState({
      inGame: false,
      gameState: 'GAME_OVER',
    })
  }

  cleanup() {
    // Reset all game objects
    this.ship = []
    this.asteroids = []
    this.bullets = []
    this.particles = []

    // Clear the canvas if context exists
    if (this.canvasRef.current) {
      const context = this.canvasRef.current.getContext('2d')
      if (context) {
        context.clearRect(
          0,
          0,
          this.state.screen.width * this.state.screen.ratio,
          this.state.screen.height * this.state.screen.ratio
        )
      }
    }
  }

  ensureContext() {
    if (!this.state.context && this.canvasRef.current) {
      const context = this.canvasRef.current.getContext('2d')
      if (context) {
        this.setState({ context })
      }
    }
  }

  generateAsteroids(howMany) {
    let ship = this.ship[0]
    for (let i = 0; i < howMany; i++) {
      let asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(
            0,
            this.state.screen.width,
            ship.position.x - 60,
            ship.position.x + 60
          ),
          y: randomNumBetweenExcluding(
            0,
            this.state.screen.height,
            ship.position.y - 60,
            ship.position.y + 60
          ),
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this),
      })
      this.createObject(asteroid, 'asteroids')
    }
  }

  createObject(item, group) {
    this[group].push(item)
  }

  updateObjects(items, group) {
    let index = 0
    for (let item of items) {
      if (item.delete) {
        this[group].splice(index, 1)
      } else {
        items[index].render(this.state)
      }
      index++
    }
  }

  checkCollisionsWith(items1, items2) {
    var a = items1.length - 1
    var b
    for (a; a > -1; --a) {
      b = items2.length - 1
      for (b; b > -1; --b) {
        var item1 = items1[a]
        var item2 = items2[b]
        if (this.checkCollision(item1, item2)) {
          item1.destroy()
          item2.destroy()
        }
      }
    }
  }

  checkCollision(obj1, obj2) {
    var vx = obj1.position.x - obj2.position.x
    var vy = obj1.position.y - obj2.position.y
    var length = Math.sqrt(vx * vx + vy * vy)
    if (length < obj1.radius + obj2.radius) {
      return true
    }
    return false
  }

  update() {
    // Ensure we have context and are in game
    if (
      !this.state.context ||
      !this.state.inGame ||
      this.state.gameState !== 'PLAYING'
    ) {
      return
    }

    const context = this.state.context

    context.save()
    context.scale(this.state.screen.ratio, this.state.screen.ratio)

    // Motion trail
    context.fillStyle = '#000'
    context.globalAlpha = 0.4
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height)
    context.globalAlpha = 1

    // Next set of asteroids
    if (!this.asteroids.length) {
      let count = this.state.asteroidCount + 1
      this.setState({ asteroidCount: count })
      this.generateAsteroids(count)
    }

    // Check for collisions
    this.checkCollisionsWith(this.bullets, this.asteroids)
    this.checkCollisionsWith(this.ship, this.asteroids)

    // Remove or render
    this.updateObjects(this.particles, 'particles')
    this.updateObjects(this.asteroids, 'asteroids')
    this.updateObjects(this.bullets, 'bullets')
    this.updateObjects(this.ship, 'ship')

    context.restore()

    // Continue animation
    if (this.state.inGame && this.state.gameState === 'PLAYING') {
      requestAnimationFrame(() => this.update())
    }
  }

  addScore(points) {
    if (this.state.inGame) {
      this.setState({
        currentScore: this.state.currentScore + points,
      })
    }
  }

  // Render methods
  renderGame() {
    const { currentScore, topScore } = this.state

    return (
      <div>
        <GameHeaderContent />
        <GameInfo
          currentScore={this.state.currentScore}
          topScore={this.state.topScore}
        />
        <div className='absolute top-5 left-1/2 -translate-x-1/2 z-10 flex gap-4'>
          <Controls>
            Use [A][S][W][D] or [←][↑][↓][→] to MOVE
            <br />
            Use [SPACE] to SHOOT
          </Controls>
          <StartButton
            onClick={this.toggleChat}
            className='bg-transparent border-2 border-game-blue text-game-blue'
          >
            CHAT
          </StartButton>
        </div>
        <canvas
          ref={this.canvasRef}
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
          className='block bg-black absolute inset-0 w-full h-full'
        />
      </div>
    )
  }

  getDisplayContent() {
    const { wallet } = this.props
    const { gameState, currentScore, signatureLoading, showChat } = this.state

    switch (gameState) {
      case 'INITIAL':
        return (
          <BaseAuthContainer title='Solana Asteroids'>
            <WalletWrapper>
              <WalletMultiButton />
              <p className='text-gray-400'>Connect your wallet to play</p>
            </WalletWrapper>
          </BaseAuthContainer>
        )

      case 'READY_TO_PLAY':
        return (
          <BaseAuthContainer title='Solana Asteroids'>
            <div className='flex flex-col items-center gap-6'>
              <StyledWalletButton>
                <WalletMultiButton />
              </StyledWalletButton>
              <div className='flex flex-col gap-4 items-center'>
                <StartButton
                  onClick={this.handleQuarterInsert}
                  disabled={signatureLoading}
                  loading={signatureLoading}
                >
                  {signatureLoading
                    ? 'Inserting Quarter...'
                    : 'Insert Quarter To Play'}
                </StartButton>
                <StartButton
                  onClick={this.toggleChat}
                  className='bg-transparent border-2 border-game-blue text-game-blue'
                >
                  CHAT
                </StartButton>
              </div>
              {signatureLoading && (
                <div className='text-game-blue animate-pulse'>
                  Processing...
                </div>
              )}
            </div>
            {showChat && <Chat onClose={this.toggleChat} />}
          </BaseAuthContainer>
        )

      case 'GAME_OVER':
        console.log('Game Over state, showing leaderboard')
        return (
          <div className='fixed inset-0 flex items-center justify-center min-h-screen bg-black/75'>
            <div className='flex flex-col items-center gap-6'>
              <GameOver
                score={currentScore}
                onPlayAgain={this.handleQuarterInsert}
                loading={signatureLoading}
              />
            </div>
            <Leaderboard
              currentScore={this.state.currentScore}
              initialScores={this.state.highScores || []}
              onClose={() => this.setState({ showLeaderboard: false })}
            />
          </div>
        )

      case 'PLAYING':
        return (
          <>
            {this.renderGame()}
            {showChat && <Chat onClose={this.toggleChat} />}
          </>
        )

      default:
        return this.renderGame()
    }
  }

  render() {
    return this.getDisplayContent()
  }
}
