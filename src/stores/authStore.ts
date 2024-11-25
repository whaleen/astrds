// src/stores/authStore.ts

import { create } from 'zustand'
import { AuthStore } from '@/types/auth'
import { authService } from '@/auth/AuthService'

const VERIFICATION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  isAuthenticating: false,
  error: null,
  walletAddress: null,
  verifiedSignature: null,
  lastVerification: null,

  authenticate: async (walletAddress) => {
    set({ isAuthenticating: true, error: null })

    try {
      const lastVerification = get().lastVerification
      const verifiedSignature = get().verifiedSignature

      // Check if we have a recent verification
      if (
        lastVerification &&
        verifiedSignature &&
        Date.now() - lastVerification < VERIFICATION_TIMEOUT
      ) {
        set({
          isAuthenticated: true,
          isAuthenticating: false,
          walletAddress,
        })
        return true
      }

      set({
        isAuthenticated: false,
        verifiedSignature: null,
        lastVerification: null,
      })

      return false
    } catch (error) {
      set({
        error:
          error instanceof Error ? error : new Error('Authentication failed'),
        isAuthenticating: false,
        isAuthenticated: false,
      })
      return false
    }
  },

  verifyWallet: async (paymentType = 'SOL') => {
    set({ isAuthenticating: true, error: null })

    try {
      const success = await authService.verifyWalletSignature(
        get().walletAddress!,
        paymentType
      )

      if (success) {
        set({
          isAuthenticated: true,
          isAuthenticating: false,
          lastVerification: Date.now(),
          verifiedSignature: 'verified', // You might want to store the actual signature
        })
        return true
      }

      throw new Error('Verification failed')
    } catch (error) {
      set({
        error:
          error instanceof Error ? error : new Error('Verification failed'),
        isAuthenticating: false,
        isAuthenticated: false,
      })
      return false
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      walletAddress: null,
      verifiedSignature: null,
      lastVerification: null,
      error: null,
    })
  },

  clearError: () => {
    set({ error: null })
  },

  setError: (error) => {
    set({ error })
  },
}))
