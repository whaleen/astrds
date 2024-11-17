import { Connection, Transaction, PublicKey, Keypair, TransactionInstruction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import BN from 'bn.js'
import { Buffer } from 'buffer'

// Check if the environment variable is set
if (!process.env.PROGRAM_AUTHORITY_PRIVATE_KEY) {
  throw new Error('PROGRAM_AUTHORITY_PRIVATE_KEY is not set in environment variables');
}

// Load the program authority's private key from environment variables
const PROGRAM_AUTHORITY_PRIVATE_KEY = Uint8Array.from(JSON.parse(process.env.PROGRAM_AUTHORITY_PRIVATE_KEY));
const keypair = Keypair.fromSecretKey(PROGRAM_AUTHORITY_PRIVATE_KEY);

// Hardcoded public key
const HARD_CODED_PUBLIC_KEY = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP');

exports.handler = async (event, context) => {
  try {
    const { playerPublicKey, tokenCount } = JSON.parse(event.body)

    const playerPublicKeyParsed = new PublicKey(playerPublicKey)
    const playerATA = await getAssociatedTokenAddress(
      HARD_CODED_PUBLIC_KEY,
      playerPublicKeyParsed
    )

    const mintToInstruction = new TransactionInstruction({
      keys: [
        { pubkey: HARD_CODED_PUBLIC_KEY, isSigner: false, isWritable: true },
        { pubkey: playerATA, isSigner: false, isWritable: true },
        { pubkey: keypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: new PublicKey('6PmJ5dNoiHXtTWcm3H23eQ5G3DZLbQ7PCwBorPhmXvef'),
      data: Buffer.from([8, ...new Uint8Array(new BN(tokenCount * 1_000_000_000).toArray('le', 8))]),
    })

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        keypair.publicKey,
        playerATA,
        playerPublicKeyParsed,
        HARD_CODED_PUBLIC_KEY
      ),
      mintToInstruction
    )

    tx.feePayer = keypair.publicKey
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    const txSignature = await connection.sendTransaction(tx, [keypair], { skipPreflight: false, preflightCommitment: 'confirmed' })
    await connection.confirmTransaction(txSignature, 'confirmed')

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, txSignature }),
    }
  } catch (error) {
    console.error('Failed to mint tokens:', error.message || error)
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Failed to mint tokens. Please try again.' }),
    }
  }
}
