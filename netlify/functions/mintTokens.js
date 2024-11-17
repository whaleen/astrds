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

function getInstructionDiscriminator(name) {
  const preimage = `global:${name}`;
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
    console.log('Player ATA:', playerATA.toBase58());
    console.log('Mint Authority:', mintAuthority.publicKey.toBase58());

    // First verify the mint account exists
    const mintAccount = await connection.getAccountInfo(MINT_PUBKEY);
    if (!mintAccount) {
      throw new Error('Mint account does not exist');
    }

    // Create mint instruction
    const mintInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        // Order matches IDL exactly
        { pubkey: MINT_PUBKEY, isSigner: false, isWritable: true },          // mint
        { pubkey: playerATA, isSigner: false, isWritable: true },            // playerTokenAccount
        { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: true },// mintAuthority
        { pubkey: playerPubkey, isSigner: true, isWritable: false },         // player
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },    // tokenProgram
      ],
      data
    });

    // Create transaction
    const transaction = new Transaction();

    // Check if ATA needs to be created
    const accountInfo = await connection.getAccountInfo(playerATA);
    if (!accountInfo) {
      console.log('Creating ATA:', playerATA.toBase58());
      transaction.add(
        createAssociatedTokenAccountInstruction(
          playerPubkey,  // Changed payer to player
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
        message: 'Transaction built successfully',
        debug: {
          mint: MINT_PUBKEY.toBase58(),
          ata: playerATA.toBase58(),
          authority: mintAuthority.publicKey.toBase58()
        }
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
