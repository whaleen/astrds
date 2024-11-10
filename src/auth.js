import { Transaction, SystemProgram, Connection } from '@solana/web3.js';

export const verifyWalletSignature = async (wallet, connection) => {
  if (!wallet.publicKey) {
    console.error('No wallet public key available');
    return false;
  }

  try {
    console.log('Starting signature verification...');
    console.log('Wallet connected:', wallet.connected);
    console.log('Public key:', wallet.publicKey.toString());

    // Create a test transaction that won't actually execute
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: wallet.publicKey,
        lamports: 0,
      })
    );

    // Get the recent blockhash
    try {
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      console.log('Got blockhash:', blockhash);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
    } catch (error) {
      console.error('Failed to get blockhash:', error);
      return false;
    }

    // Request signature from user
    try {
      console.log('Requesting signature...');
      const signed = await wallet.signTransaction(transaction);
      console.log('Transaction signed successfully');
      return true;
    } catch (error) {
      console.error('Signature request failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
};
