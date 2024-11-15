// src/utils/tokenBalances.js
import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

export async function getTokenBalances(walletAddress, tokenMints) {
  try {
    const connection = new Connection(
      import.meta.env.VITE_SOLANA_RPC_ENDPOINT,
      'confirmed'
    )

    // Get all token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      {
        programId: TOKEN_PROGRAM_ID,
      }
    )

    // Create a map of mint addresses to balances
    const balances = {}

    // Initialize all requested token balances to 0
    tokenMints.forEach(mint => {
      balances[mint] = 0
    })

    // Update balances for tokens that are found
    tokenAccounts.value.forEach(account => {
      const parsedInfo = account.account.data.parsed.info
      const mintAddress = parsedInfo.mint

      if (tokenMints.includes(mintAddress)) {
        balances[mintAddress] = Number(parsedInfo.tokenAmount.amount) /
          Math.pow(10, parsedInfo.tokenAmount.decimals)
      }
    })

    // Get SOL balance
    const solBalance = await connection.getBalance(new PublicKey(walletAddress))
    balances.SOL = solBalance / 1e9 // Convert lamports to SOL

    return balances
  } catch (error) {
    console.error('Error fetching token balances:', error)
    return {
      SOL: 0,
      ...tokenMints.reduce((acc, mint) => ({ ...acc, [mint]: 0 }), {})
    }
  }
}

// Add export for verify function too
export async function verifyTokenBalance(walletAddress, tokenType, requiredAmount) {
  try {
    const connection = new Connection(
      import.meta.env.VITE_SOLANA_RPC_ENDPOINT,
      'confirmed'
    )

    if (tokenType === 'SOL') {
      const balance = await connection.getBalance(new PublicKey(walletAddress))
      return (balance / 1e9) >= requiredAmount // Convert lamports to SOL
    }

    // For ASTRDS token
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      {
        programId: TOKEN_PROGRAM_ID,
      }
    )

    const tokenAccount = tokenAccounts.value.find(
      account => account.account.data.parsed.info.mint === tokenType
    )

    if (!tokenAccount) return false

    const balance = Number(tokenAccount.account.data.parsed.info.tokenAmount.amount) /
      Math.pow(10, tokenAccount.account.data.parsed.info.tokenAmount.decimals)

    return balance >= requiredAmount
  } catch (error) {
    console.error('Error verifying token balance:', error)
    throw error
  }
}
