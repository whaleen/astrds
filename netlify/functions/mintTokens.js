// netlify/functions/mintTokens.js
const { Connection, Transaction, PublicKey, Keypair, TransactionInstruction } = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const BN = require('bn.js');
const crypto = require('crypto');  // Added this line

function getInstructionDiscriminator(name) {
  // Anchor prefixes the name with 'global:' namespace
  const preimage = `global:${name}`;

  // Create a buffer for sha256 hash
  let hash = Buffer.from(
    crypto
      .createHash('sha256')
      .update(preimage)
      .digest()
  ).slice(0, 8);

  console.log(`Discriminator for ${name}:`, hash);
  return hash;
}

function serializeU64(value) {
  const buffer = Buffer.alloc(8);
  new BN(value).toArrayLike(Buffer, 'le', 8).copy(buffer);
  return buffer;
}

exports.handler = async (event, context) => {
  try {
    const { playerPublicKey, tokenCount } = JSON.parse(event.body);

    // Validate token count against program constraints
    if (tokenCount <= 0) {
      throw new Error('No tokens collected');
    }
    if (tokenCount > 200) {
      throw new Error('Maximum 200 tokens can be collected per game');
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

    // Create instruction data
    const discriminator = getInstructionDiscriminator('mint_game_reward');
    const data = Buffer.concat([
      discriminator,
      serializeU64(tokenCount)
    ]);

    console.log('Instruction data:', data.toString('hex'));

    // Create mint instruction
    const mintInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        // Order matches IDL exactly
        { pubkey: MINT_PUBKEY, isSigner: false, isWritable: true },
        { pubkey: playerATA, isSigner: false, isWritable: true },
        { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: true },
        { pubkey: playerPubkey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data
    });

    // Create transaction
    const transaction = new Transaction();

    // Check if ATA needs to be created
    const accountInfo = await connection.getAccountInfo(playerATA);
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
