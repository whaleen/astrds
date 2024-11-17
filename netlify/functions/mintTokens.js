// netlify/functions/mintTokens.js
const anchor = require('@project-serum/anchor');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} = require('@solana/spl-token');

// Program IDL - this should match your program exactly
const IDL = {
  "version": "0.1.0",
  "name": "astrds_game_rewards",
  "instructions": [{
    "name": "mintGameReward",
    "accounts": [
      { "name": "mint", "isMut": true, "isSigner": false },
      { "name": "playerTokenAccount", "isMut": true, "isSigner": false },
      { "name": "mintAuthority", "isMut": true, "isSigner": true },
      { "name": "player", "isMut": false, "isSigner": true },
      { "name": "tokenProgram", "isMut": false, "isSigner": false }
    ],
    "args": [{ "name": "collectedTokens", "type": "u64" }]
  }]
};

exports.handler = async (event, context) => {
  try {
    const { playerPublicKey, tokenCount } = JSON.parse(event.body);

    if (tokenCount <= 0 || tokenCount > 200) {
      throw new Error('Invalid token count');
    }

    // Setup connection and program
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const provider = new anchor.AnchorProvider(
      connection,
      {
        publicKey: new PublicKey(playerPublicKey),
        signTransaction: async (tx) => tx, // We'll sign later
      },
      { commitment: 'confirmed' }
    );

    const program = new anchor.Program(
      IDL,
      '6PmJ5dNoiHXtTWcm3H23eQ5G3DZLbQ7PCwBorPhmXvef',
      provider
    );

    const MINT_PUBKEY = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP');
    const playerPubkey = new PublicKey(playerPublicKey);
    const mintAuthority = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.PROGRAM_AUTHORITY_PRIVATE_KEY))
    );

    // Get player's ATA
    const playerATA = await getAssociatedTokenAddress(
      MINT_PUBKEY,
      playerPubkey
    );

    // Build the transaction using Anchor
    const tx = await program.methods
      .mintGameReward(new anchor.BN(tokenCount))
      .accounts({
        mint: MINT_PUBKEY,
        playerTokenAccount: playerATA,
        mintAuthority: mintAuthority.publicKey,
        player: playerPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    // Add the mint authority as a signer
    tx.partialSign(mintAuthority);

    const serializedTransaction = tx.serialize({
      requireAllSignatures: false
    }).toString('base64');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        serializedTransaction
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
