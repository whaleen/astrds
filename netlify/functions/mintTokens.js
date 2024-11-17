// netlify/functions/mintTokens.js
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider, BN, Wallet } from '@project-serum/anchor'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'

const MINT_ADDRESS = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP')
const PROGRAM_ID = new PublicKey('6PmJ5dNoiHXtTWcm3H23eQ5G3DZLbQ7PCwBorPhmXvef')
const EXPECTED_AUTHORITY = new PublicKey('EUeL2L6KtWF6r2hCwg6rYyTc3161gESkVx5d3WxagLyf')

// Load and verify authority keypair
const loadAndVerifyAuthority = () => {
  try {
    if (!process.env.PROGRAM_AUTHORITY_PRIVATE_KEY) {
      throw new Error('Missing PROGRAM_AUTHORITY_PRIVATE_KEY environment variable')
    }

    const authorityKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(process.env.PROGRAM_AUTHORITY_PRIVATE_KEY))
    )

    return authorityKeypair
  } catch (error) {
    console.error('Failed to load authority keypair:', error)
    throw error
  }
}

// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}

export const handler = async (event) => {
  try {
    // First verify our authority keypair
    console.log('Verifying authority keypair...')
    const authorityKeypair = loadAndVerifyAuthority()

    const { playerPublicKey, tokenCount } = JSON.parse(event.body)
    console.log('Minting request received:', { playerPublicKey, tokenCount })

    // Validate input parameters
    if (!playerPublicKey || tokenCount <= 0 || tokenCount > 200) {
      throw new ValidationError('Invalid mint parameters')
    }

    // Initialize connection with commitment
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed'
    )

    // Create proper provider with authority wallet
    const provider = new AnchorProvider(
      connection,
      new Wallet(authorityKeypair),
      { commitment: 'confirmed' }
    )

    // Initialize program
    const program = new Program(IDL, PROGRAM_ID, provider)

    // Get player's ATA
    const playerPubkey = new PublicKey(playerPublicKey)
    const playerATA = await getAssociatedTokenAddress(
      MINT_ADDRESS,
      playerPubkey
    )

    // Build and send transaction
    const tx = await program.methods
      .mintGameReward(new BN(tokenCount))
      .accounts({
        mint: MINT_ADDRESS,
        playerTokenAccount: playerATA,
        mintAuthority: authorityKeypair.publicKey,
        player: playerPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authorityKeypair])
      .rpc()

    console.log('Mint transaction successful:', tx)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        serializedTransaction: tx,
      })
    }

  } catch (error) {
    console.error('Mint failed:', error)

    // Handle specific error types
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      }
    } else if (error instanceof NetworkError) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          success: false,
          error: 'Network error occurred. Please try again later.'
        })
      }
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'An unexpected error occurred. Please try again later.'
        })
      }
    }
  }
}

const IDL = {
  "version": "0.1.0",
  "name": "astrds_game_rewards",
  "instructions": [
    {
      "name": "mintGameReward",
      "accounts": [
        { "name": "mint", "isMut": true, "isSigner": false },
        { "name": "playerTokenAccount", "isMut": true, "isSigner": false },
        { "name": "mintAuthority", "isMut": true, "isSigner": true },
        { "name": "player", "isMut": false, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "collectedTokens", "type": "u64" }]
    }
  ]
}
