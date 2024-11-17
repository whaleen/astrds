// netlify/functions/mintTokens.js
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = require('@solana/spl-token');
const BN = require('bn.js');

const PROGRAM_ID = new PublicKey('6PmJ5dNoiHXtTWcm3H23eQ5G3DZLbQ7PCwBorPhmXvef');
const ASTRDS_MINT = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { playerPublicKey, tokenCount } = JSON.parse(event.body);

    if (!playerPublicKey || !tokenCount) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
    }

    const programAuthorityKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(process.env.PROGRAM_AUTHORITY_KEYPAIR))
    );

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const playerATA = await getAssociatedTokenAddress(ASTRDS_MINT, new PublicKey(playerPublicKey));

    const mintToInstruction = new TransactionInstruction({
      keys: [
        { pubkey: ASTRDS_MINT, isSigner: false, isWritable: true },
        { pubkey: playerATA, isSigner: false, isWritable: true },
        { pubkey: programAuthorityKeypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([
        8,
        ...new Uint8Array(new BN(tokenCount * 1_000_000_000).toArray('le', 8)),
      ]),
    });

    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        programAuthorityKeypair.publicKey,
        playerATA,
        new PublicKey(playerPublicKey),
        ASTRDS_MINT
      ),
      mintToInstruction
    );

    transaction.feePayer = programAuthorityKeypair.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    transaction.sign(programAuthorityKeypair);

    const txSignature = await connection.sendTransaction(transaction, [programAuthorityKeypair]);
    await connection.confirmTransaction(txSignature, 'confirmed');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, txSignature }),
    };
  } catch (error) {
    console.error('Error minting tokens:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to mint tokens' }),
    };
  }
};
