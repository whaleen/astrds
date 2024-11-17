// netlify/functions/mintTokens.js
const { Connection, Transaction, PublicKey, Keypair, TransactionInstruction } = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const BN = require('bn.js');
const crypto = require('crypto');

function deriveDiscriminator(name) {
  // Convert the namespace and name to a string of the form "global:name"
  const preimage = `global:${name}`;
  // Take the first 8 bytes of the hash
  return Buffer.from(crypto.createHash('sha256').update(preimage).digest()).slice(0, 8);
}

// Function to create instruction data with proper Anchor format
function createInstructionData(collectedTokens) {
  // Get discriminator for 'mint_game_reward'
  const discriminator = deriveDiscriminator('mint_game_reward');

  // Create a buffer for the collected tokens (u64)
  const tokenBuffer = Buffer.alloc(8);
  new BN(collectedTokens).toArrayLike(Buffer, 'le', 8).copy(tokenBuffer);

  return Buffer.concat([discriminator, tokenBuffer]);
}

exports.handler = async (event, context) => {
  try {
    const { playerPublicKey, tokenCount } = JSON.parse(event.body);

    if (tokenCount > 200) {
      throw new Error('Maximum 200 tokens can be collected per game');
    }

    if (tokenCount <= 0) {
      throw new Error('No tokens collected');
    }

    if (!process.env.PROGRAM_AUTHORITY_PRIVATE_KEY) {
      throw new Error('PROGRAM_AUTHORITY_PRIVATE_KEY is not set');
    }

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const mintAuthority = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.PROGRAM_AUTHORITY_PRIVATE_KEY))
    );

    const PROGRAM_ID = new PublicKey('6PmJ5dNoiHXtTWcm3H23eQ5G3DZLbQ7PCwBorPhmXvef');
    const MINT_PUBKEY = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP');
    const playerPubkey = new PublicKey(playerPublicKey);

    // Get player's ATA
    const playerATA = await getAssociatedTokenAddress(
      MINT_PUBKEY,
      playerPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Check if account exists
    const accountInfo = await connection.getAccountInfo(playerATA);

    // Create transaction
    const transaction = new Transaction();

    // Add create ATA instruction if needed
    if (!accountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          mintAuthority.publicKey,
          playerATA,
          playerPubkey,
          MINT_PUBKEY,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Log the instruction data for debugging
    const instructionData = createInstructionData(tokenCount);
    console.log('Instruction Data:', Buffer.from(instructionData).toString('hex'));

    // Create mint instruction
    const mintInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: MINT_PUBKEY, isSigner: false, isWritable: true },
        { pubkey: playerATA, isSigner: false, isWritable: true },
        { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: true },
        { pubkey: playerPubkey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: instructionData
    });

    transaction.add(mintInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = playerPubkey;

    // Partially sign with mint authority
    transaction.partialSign(mintAuthority);

    // Serialize the transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false
    }).toString('base64');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        serializedTransaction,
        message: 'Transaction built successfully'
      }),
    };

  } catch (error) {
    console.error('Detailed error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
    };
  }
};
