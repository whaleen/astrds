// src/auth/auth.ts
import { authService } from './AuthService'

export const verifyWalletSignature = async (wallet, connection) => {
  if (!wallet.publicKey) {
    console.error('No wallet public key available')
    return false
  }

  try {
    return await authService.verifyWalletSignature(wallet)
  } catch (error) {
    console.error('Wallet verification failed:', error)
    return false
  }
}

export const isWalletVerified = (wallet) => {
  if (!wallet.publicKey) return false
  return authService.verifiedSessions.has(wallet.publicKey.toString())
}
