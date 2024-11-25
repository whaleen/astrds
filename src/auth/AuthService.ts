// src/auth/AuthService.ts
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

const RECIPIENT_WALLET = new PublicKey(
  'AMKzF4Phzhp8htd9xerLSm1aderQT7t2v35HzbhDAjvE'
)
const TOKEN_MINT = new PublicKey('8a73Nvt2dAo67Mg5YnjhFNxqj4p1JpBuVGKnhvzbZDJP')
const SOL_COST = 0.05
const TOKEN_COST = 1000

class AuthService {
  private verifiedSessions: Set<string>
  private connection: Connection

  constructor() {
    this.verifiedSessions = new Set()
    this.connection = new Connection(import.meta.env.VITE_SOLANA_RPC_ENDPOINT)
  }

  async getMintDecimals(): Promise<number> {
    try {
      const mintInfo = await getMint(this.connection, TOKEN_MINT)
      return mintInfo.decimals
    } catch (error) {
      console.error('Error getting mint info:', error)
      return 6 // Default to 6 decimals if we can't fetch
    }
  }

  async getTokenAmount(uiAmount: number): Promise<number> {
    const decimals = await this.getMintDecimals()
    return Math.floor(uiAmount * Math.pow(10, decimals))
  }

  async ensureTokenAccount(
    walletPubkey: PublicKey,
    isSource = true
  ): Promise<PublicKey | null> {
    const tokenAddress = await getAssociatedTokenAddress(
      TOKEN_MINT,
      isSource ? walletPubkey : RECIPIENT_WALLET
    )

    try {
      await getAccount(this.connection, tokenAddress)
      console.log(
        `Token account found for ${
          isSource ? 'sender' : 'recipient'
        }: ${tokenAddress.toString()}`
      )
      return tokenAddress
    } catch (error) {
      console.log(
        `Token account not found for ${
          isSource ? 'sender' : 'recipient'
        }, creating...`
      )
      return null
    }
  }

  async createPaymentTransaction(
    walletPubkey: PublicKey,
    paymentType = 'SOL'
  ): Promise<Transaction> {
    const transaction = new Transaction()

    if (paymentType === 'SOL') {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPubkey,
          toPubkey: RECIPIENT_WALLET,
          lamports: SOL_COST * 1e9,
        })
      )
    } else if (paymentType === 'ASTRDS') {
      const tokenAmount = await this.getTokenAmount(TOKEN_COST)
      console.log(`Converting ${TOKEN_COST} ASTRDS to ${tokenAmount} raw units`)

      // Get token account addresses
      const fromTokenAddress = await getAssociatedTokenAddress(
        TOKEN_MINT,
        walletPubkey
      )
      const toTokenAddress = await getAssociatedTokenAddress(
        TOKEN_MINT,
        RECIPIENT_WALLET
      )

      // Check if accounts exist
      const fromAccountExists = await this.ensureTokenAccount(
        walletPubkey,
        true
      )
      const toAccountExists = await this.ensureTokenAccount(
        RECIPIENT_WALLET,
        false
      )

      // Create accounts if needed
      if (!fromAccountExists) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            walletPubkey,
            fromTokenAddress,
            walletPubkey,
            TOKEN_MINT
          )
        )
      }

      if (!toAccountExists) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            walletPubkey,
            toTokenAddress,
            RECIPIENT_WALLET,
            TOKEN_MINT
          )
        )
      }

      // Add transfer instruction using the resolved addresses
      transaction.add(
        createTransferInstruction(
          fromTokenAddress,
          toTokenAddress,
          walletPubkey,
          tokenAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      )
    }

    return transaction
  }

  async getTokenBalance(walletPubkey: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        walletPubkey
      )
      console.log(
        `Token account found for ${walletPubkey}: ${tokenAccount.toString()}`
      )
      const accountInfo = await this.connection.getTokenAccountBalance(
        tokenAccount
      )
      return accountInfo.value.uiAmount || 0
    } catch {
      console.log('No token account found, balance is 0')
      return 0
    }
  }

  clearSession(publicKey: PublicKey): void {
    this.verifiedSessions.delete(publicKey.toString())
  }

  async verifyWalletSignature(
    wallet: any,
    paymentType = 'SOL'
  ): Promise<boolean> {
    if (!wallet.publicKey) throw new Error('No wallet connected')

    const sessionKey = wallet.publicKey.toString()
    if (this.verifiedSessions.has(sessionKey)) {
      return true
    }

    try {
      if (paymentType === 'ASTRDS') {
        const tokenBalance = await this.getTokenBalance(wallet.publicKey)
        console.log(`Current token balance: ${tokenBalance} ASTRDS`)
        if (tokenBalance < TOKEN_COST) {
          throw new Error(
            `Insufficient ASTRDS balance. Required: ${TOKEN_COST} ASTRDS`
          )
        }
      } else {
        const solBalance = await this.connection.getBalance(wallet.publicKey)
        if (solBalance < SOL_COST * 1e9) {
          throw new Error(`Insufficient SOL balance. Required: ${SOL_COST} SOL`)
        }
      }

      console.log(
        `Creating ${paymentType} payment transaction for ${wallet.publicKey.toString()}`
      )
      const transaction = await this.createPaymentTransaction(
        wallet.publicKey,
        paymentType
      )

      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = wallet.publicKey

      const signedTx = await wallet.signTransaction(transaction)
      const signature = await this.connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      )

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })

      this.verifiedSessions.add(sessionKey)
      return true
    } catch (error) {
      console.error('Verification failed:', error)
      throw error
    }
  }

  public isVerified(publicKey: string): boolean {
    return this.verifiedSessions.has(publicKey)
  }
}

export const authService = new AuthService()
