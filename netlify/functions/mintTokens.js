// netlify/functions/mintTokens.js
const { Connection, Transaction, PublicKey, Keypair, TransactionInstruction } = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const BN = require('bn.js');

// Function to create instruction data with proper Anchor format
function createInstructionData(collectedTokens) {
  // Anchor discriminator for 'mint_game_reward' instruction
  const MINT_IX_DISCRIMINATOR = [175, 175, 109, 31, 13, 152, 155, 237];

  // Create a buffer for the collected tokens (u64)
  const tokenBuffer = Buffer.alloc(8);
  new BN(collectedTokens).toArrayLike(Buffer, 'le', 8).copy(tokenBuffer);

  return Buffer.concat([Buffer.from(MINT_IX_DISCRIMINATOR), tokenBuffer]);
}

exports.handler = async (event, context) => {
  try {
    const { playerPublicKey, tokenCount } = JSON.parse(event.body);

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

    // Create mint instruction matching the IDL structure
    const mintInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        // Exactly matching the IDL account order
        { pubkey: MINT_PUBKEY, isSigner: false, isWritable: true },          // mint
        { pubkey: playerATA, isSigner: false, isWritable: true },            // playerTokenAccount
        { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: true },// mintAuthority
        { pubkey: playerPubkey, isSigner: true, isWritable: false },         // player
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },    // tokenProgram
      ],
      data: createInstructionData(tokenCount)
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
