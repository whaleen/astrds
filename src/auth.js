import { SystemProgram } from '@solana/web3.js';

export const verifyWalletSignature = async (wallet, connection) => {
  if (!wallet.publicKey) {
    console.error('No wallet public key available');
    return false;
  }

  try {
    console.log('Starting signature verification...');
    console.log('Wallet connected:', wallet.connected);
    console.log('Public key:', wallet.publicKey.toString());

    // Create a simple message to sign
    const message = new Uint8Array([
      ...new TextEncoder().encode('Play Asteroids: '),
      ...new TextEncoder().encode(new Date().toISOString()),
    ]);

    // Request signature from user
    try {
      console.log('Requesting signature...');
      const signature = await wallet.signMessage(message);
      console.log('Message signed successfully');
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
