// src/auth.js
export const verifyWalletSignature = async (wallet, connection) => {
  if (!wallet.publicKey) {
    console.error('No wallet public key available')
    return false
  }

  try {
    // Add timestamp to make each signature unique
    const signatureMessage =
      "Play Asteroids!\n\n" +
      "Insert Quarter (0.25 USD worth of SOL)\n" +
      "Transaction ID: " + new Date().toISOString() + "\n" +
      "Wallet: " + wallet.publicKey.toString()

    // Create byte array from message
    const message = new TextEncoder().encode(signatureMessage)

    // Request signature from user
    console.log('Requesting wallet signature...')
    const signature = await wallet.signMessage(message)

    if (signature) {
      console.log('Message signed successfully, signature verified')

      // Store the verification in session storage
      sessionStorage.setItem('wallet_verified', 'true')
      sessionStorage.setItem('wallet_address', wallet.publicKey.toString())

      return true
    }

    console.log('Signature verification failed')
    return false
  } catch (error) {
    console.error('Signature request failed:', error)

    // If we get a disconnected port error, clear session storage and reload
    if (error.message?.includes('disconnected port')) {
      sessionStorage.removeItem('wallet_verified')
      sessionStorage.removeItem('wallet_address')
      window.location.reload()
      return false
    }

    return false
  }
}

// Add helper function to check if wallet was previously verified
export const isWalletVerified = (wallet) => {
  const verified = sessionStorage.getItem('wallet_verified') === 'true'
  const storedAddress = sessionStorage.getItem('wallet_address')
  return verified && storedAddress === wallet.publicKey?.toString()
}
