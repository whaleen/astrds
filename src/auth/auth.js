// src/auth/auth.js
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'

const RECIPIENT_WALLET_ADDRESS = 'AMKzF4Phzhp8htd9xerLSm1aderQT7t2v35HzbhDAjvE'
const TOKEN_MINT_ADDRESS = '8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP'

export const verifyWalletSignature = async (wallet, connection) => {
  if (!wallet.publicKey) {
    console.error('No wallet public key available')
    return false
  }

  try {
    // Check if the user has sufficient SOL or tokens
    const solBalance = await connection.getBalance(wallet.publicKey)
    const tokenBalance = await getTokenBalance(wallet.publicKey, connection)

    const requiredSol = 0.05 * 1e9 // 0.05 SOL in lamports
    const requiredTokens = 1000

    if (solBalance < requiredSol && tokenBalance < requiredTokens) {
      console.log('Insufficient SOL or token balance')
      return false
    }

    // Add timestamp to make each signature unique
    const signatureMessage =
      "Play Asteroids!\n\n" +
      "Insert Quarter (0.05 SOL or 1000 ASTRD tokens)\n" +
      "Transaction ID: " + new Date().toISOString() + "\n" +
      "Wallet: " + wallet.publicKey.toString()

    // Create byte array from message
    const message = new TextEncoder().encode(signatureMessage)

    // Request signature from user
    console.log('Requesting wallet signature...')
    const signature = await wallet.signMessage(message)

    if (signature) {
      console.log('Message signed successfully, signature verified')

      // Create the transaction
      // Prompt the user to approve the transaction
      const transaction = new Transaction()

      // Get the recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash

      // Set the fee payer
      transaction.feePayer = wallet.publicKey

      if (solBalance >= requiredSol) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(RECIPIENT_WALLET_ADDRESS),
            lamports: requiredSol,
          })
        )
      } else {
        const recipientTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(TOKEN_MINT_ADDRESS),
          new PublicKey(RECIPIENT_WALLET_ADDRESS)
        )

        transaction.add(
          createTransferInstruction(
            await getAssociatedTokenAddress(
              new PublicKey(TOKEN_MINT_ADDRESS),
              wallet.publicKey
            ),
            recipientTokenAccount,
            wallet.publicKey,
            requiredTokens
          )
        )
      }

      // Send the transaction
      const txSignature = await wallet.signTransaction(transaction)
      const result = await connection.sendRawTransaction(txSignature.serialize())

      console.log('Transaction sent:', result)

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

const getTokenBalance = async (publicKey, connection) => {
  try {
    const tokenAccount = await getAssociatedTokenAddress(
      new PublicKey(TOKEN_MINT_ADDRESS),
      publicKey
    )

    const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount)
    return tokenAccountInfo.value.uiAmount
  } catch (error) {
    console.error('Error retrieving token balance:', error)
    return 0
  }
}

// Add helper function to check if wallet was previously verified
export const isWalletVerified = (wallet) => {
  const verified = sessionStorage.getItem('wallet_verified') === 'true'
  const storedAddress = sessionStorage.getItem('wallet_address')
  return verified && storedAddress === wallet.publicKey?.toString()
}
