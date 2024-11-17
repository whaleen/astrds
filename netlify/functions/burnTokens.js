// netlify/functions/burnTokens.js
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider, BN, Wallet } from '@project-serum/anchor'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'

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

const MINT_ADDRESS = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP')
const BURN_PROGRAM_ID = new PublicKey('ACtXctJ38tvu8JDeg3a4nt9hRTf9AxsYjsd23XCvmHpe')

// Load authority keypair from environment
const authorityKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.PROGRAM_AUTHORITY_PRIVATE_KEY))
)

const IDL = {
  "version": "0.1.0",
  "name": "astrds_burn_program",
  "instructions": [
    {
      "name": "autoBurnGameFee",
      "accounts": [
        { "name": "mint", "isMut": true, "isSigner": false },
        { "name": "feeCollectorTokenAccount", "isMut": true, "isSigner": false },
        { "name": "feeAuthority", "isMut": true, "isSigner": true },
        { "name": "player", "isMut": false, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    }
  ]
}

export const handler = async (event) => {
  try {
    const { playerPublicKey, amount = 1000 } = JSON.parse(event.body)
    console.log('Burn request received:', { playerPublicKey, amount })

    // Validate input parameters
    if (!playerPublicKey || amount <= 0) {
      throw new ValidationError('Invalid burn parameters: playerPublicKey and amount must be provided and amount must be greater than 0.')
    }

    // Initialize connection
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed'
    )

    // Create provider with authority wallet
    const provider = new AnchorProvider(
      connection,
      new Wallet(authorityKeypair),
      { commitment: 'confirmed' }
    )

    // Initialize program
    const program = new Program(IDL, BURN_PROGRAM_ID, provider)

    // Get fee collector's ATA
    const feeCollectorATA = await getAssociatedTokenAddress(
      MINT_ADDRESS,
      authorityKeypair.publicKey
    )

    console.log('Building burn transaction with accounts:', {
      mint: MINT_ADDRESS.toString(),
      feeCollectorATA: feeCollectorATA.toString(),
      feeAuthority: authorityKeypair.publicKey.toString(),
      player: playerPublicKey
    })

    // Execute the burn
    const tx = await program.methods
      .autoBurnGameFee(new BN(amount))
      .accounts({
        mint: MINT_ADDRESS,
        feeCollectorTokenAccount: feeCollectorATA,
        feeAuthority: authorityKeypair.publicKey,
        player: new PublicKey(playerPublicKey),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authorityKeypair])
      .rpc()

    console.log('Burn transaction successful:', tx)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        signature: tx,
      })
    }

  } catch (error) {
    console.error('Burn failed:', error)

    // Handle specific error types
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      }
    } else if (error.message.includes('network')) {
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
