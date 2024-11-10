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

export class SolanaAsteroids extends Component {
  // 2. Constructor
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
    }

    this.canvasRef = React.createRef()
    this.ship = []
    this.asteroids = []
    this.bullets = []
    this.particles = []
  }

  // 3. Lifecycle methods
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

  // 4. Event handlers
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

  // 5. Game logic methods
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

    // Submit score if it's worth recording
    if (this.state.currentScore > 0) {
      try {
        await submitScore(
          this.state.currentScore,
          this.props.wallet.publicKey?.toString()
        )
      } catch (error) {
        console.error('Failed to submit score:', error)
      }
    }

    this.cleanup()
    this.setState({
      inGame: false,
      gameState: 'GAME_OVER',
      context: null,
      showLeaderboard: true, // Show leaderboard on game over
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

  // 6. Render methods
  renderGame() {
    const { currentScore, topScore } = this.state

    return (
      <div>
        <span className='score current-score'>Score: {currentScore}</span>
        <div className='game-header'>
          <span className='score'>Top Score: {topScore}</span>
          <VolumeControl />
          <div className='wallet-game-button'>
            <WalletMultiButton />
          </div>
        </div>
        <span className='controls'>
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE
          <br />
          Use [SPACE] to SHOOT
        </span>
        <canvas
          ref={this.canvasRef}
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
      </div>
    )
  }

  getDisplayContent() {
    const { wallet } = this.props
    const { gameState, currentScore, signatureLoading } = this.state

    switch (gameState) {
      case 'INITIAL':
        return (
          <div className='auth-container'>
            <h1>Solana Asteroids</h1>
            <div className='wallet-section'>
              <WalletMultiButton />
              <p>Connect your wallet to play</p>
            </div>
          </div>
        )

      case 'READY_TO_PLAY':
        return (
          <div className='auth-container'>
            <h1>Solana Asteroids</h1>
            <div className='wallet-section'>
              <WalletMultiButton />
              <button
                className='start-button'
                onClick={this.handleQuarterInsert}
                disabled={signatureLoading}
              >
                {signatureLoading
                  ? 'Inserting Quarter...'
                  : 'Insert Quarter To Play'}
              </button>
            </div>
          </div>
        )

      case 'GAME_OVER':
        return (
          <div className='auth-container'>
            <div className='wallet-section'>
              <div className='endgame'>
                <p>Game over, man!</p>
                <p>
                  {currentScore > 0
                    ? `${currentScore} Points!`
                    : '0 points... So sad.'}
                </p>
                <button
                  className='start-button'
                  onClick={this.handleQuarterInsert}
                  disabled={signatureLoading}
                >
                  {signatureLoading
                    ? 'Inserting Quarter...'
                    : 'Add A Quarter, Play Again'}
                </button>
              </div>
            </div>
            {this.state.showLeaderboard && (
              <Leaderboard
                currentScore={this.state.currentScore}
                onClose={() => this.setState({ showLeaderboard: false })}
              />
            )}
          </div>
        )

      case 'PLAYING':
      default:
        return this.renderGame()
    }
  }

  render() {
    return this.getDisplayContent()
  }
}
