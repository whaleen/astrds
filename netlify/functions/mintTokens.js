// netlify/functions/mintTokens.js
const { Connection, Transaction, PublicKey, Keypair } = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const BN = require('bn.js');

// Constants
const PROGRAM_ID = new PublicKey('6PmJ5dNoiHXtTWcm3H23eQ5G3DZLbQ7PCwBorPhmXvef');
const MINT_PUBKEY = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP');

// Anchor program instruction data
const getMintInstructionData = (amount) => {
  const layout = {
    discriminator: Buffer.from([77, 205, 119, 236, 50, 54, 118, 149]),
    amount: Buffer.alloc(8)
  };

  new BN(amount).toArrayLike(Buffer, 'le', 8).copy(layout.amount);
  return Buffer.concat([layout.discriminator, layout.amount]);
};

// Main handler
exports.handler = async (event, context) => {
  try {
    // Input validation
    const { playerPublicKey, tokenCount } = JSON.parse(event.body);

    if (!playerPublicKey) throw new Error('Player public key is required');
    if (typeof tokenCount !== 'number') throw new Error('Token count must be a number');
    if (tokenCount <= 0) throw new Error('No tokens collected');
    if (tokenCount > 200) throw new Error('Maximum 200 tokens can be collected per game');

    // Setup connection and accounts
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const mintAuthority = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.PROGRAM_AUTHORITY_PRIVATE_KEY))
    );
    const playerPubkey = new PublicKey(playerPublicKey);

    // Get/create player's token account
    const playerATA = await getAssociatedTokenAddress(
      MINT_PUBKEY,
      playerPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Build transaction
    const transaction = new Transaction();

    // Check if we need to create the ATA
    const accountInfo = await connection.getAccountInfo(playerATA);
    if (!accountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          playerPubkey,      // payer
          playerATA,         // ata
          playerPubkey,      // owner
          MINT_PUBKEY,       // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Add mint instruction
    transaction.add({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: MINT_PUBKEY, isSigner: false, isWritable: true },
        { pubkey: playerATA, isSigner: false, isWritable: true },
        { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: true },
        { pubkey: playerPubkey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: getMintInstructionData(tokenCount)
    });

    // Finalize transaction
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = playerPubkey;
    transaction.partialSign(mintAuthority);

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false
    }).toString('base64');

    // Return successful response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        serializedTransaction,
        message: 'Transaction ready for signing'
      })
    };

  } catch (error) {
    // Proper error handling with specific error types
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message.includes('Invalid public key')) {
      statusCode = 400;
      errorMessage = 'Invalid wallet address provided';
    } else if (error.message.includes('No tokens collected')) {
      statusCode = 400;
      errorMessage = 'Token count must be greater than 0';
    } else if (error.message.includes('Maximum 200 tokens')) {
      statusCode = 400;
      errorMessage = 'Cannot mint more than 200 tokens at once';
    }

    return {
      statusCode,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
