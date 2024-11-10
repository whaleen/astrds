// auth.js
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

export const verifyWalletSignature = async (wallet, connection) => {
  if (!wallet.publicKey) return false;

  try {
    // Create a test transaction that won't actually execute
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: wallet.publicKey,
        lamports: 0,
      })
    );

    // Get the recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Request signature from user
    const signed = await wallet.signTransaction(transaction);

    return true;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
