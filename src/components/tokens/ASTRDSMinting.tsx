// src/components/tokens/ASTRDSMinting.tsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameData } from '@/stores/gameData'

const ASTRDSMinting: React.FC<{ tokenCount: number }> = ({ tokenCount }) => {
  const { publicKey } = useWallet()
  const verifyTokensForMinting = useGameData((state) => state.verifyTokensForMinting)
  const currentSessionId = useGameData((state) => state.currentSessionId)
  const sessionState = useGameData((state) => state.sessionState)
  const [hasFetched, setHasFetched] = useState(false)
  const [verifiedCount, setVerifiedCount] = useState<number | null>(null)

  const [status, setStatus] = useState({
    loading: false,
    error: null as string | null,
    signature: null as string | null,
  })

  // Fetch and verify token count on mount
  useEffect(() => {
    const verifyTokens = async () => {
      if (!currentSessionId || hasFetched) return;

      try {
        console.log('Starting token verification:', {
          sessionId: currentSessionId,
          clientCount: tokenCount
        });

        const serverCount = await verifyTokensForMinting();
        console.log('Token verification result:', {
          clientCount: tokenCount,
          serverCount
        });

        setVerifiedCount(serverCount);
      } catch (error) {
        console.error('Token verification failed:', error);
      }
      setHasFetched(true);
    };

    verifyTokens();
  }, [currentSessionId, hasFetched]);

  const mintGameTokens = async () => {
    if (!publicKey || !verifiedCount || verifiedCount <= 0) {
      console.warn('Invalid mint attempt:', {
        publicKey: publicKey?.toString(),
        verifiedCount,
        currentSessionId,
        sessionState
      });
      return;
    }

    try {
      setStatus({ loading: true, error: null, signature: null });

      // Use the verified count from server for minting
      console.log('Initiating mint with verified count:', verifiedCount);
      const mintResponse = await fetch('/.netlify/functions/mintTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerPublicKey: publicKey.toString(),
          tokenCount: verifiedCount,
        }),
      });

      const result = await mintResponse.json();
      if (!result.success) {
        throw new Error(result.error || 'Minting failed');
      }

      setStatus({
        loading: false,
        error: null,
        signature: result.serializedTransaction,
      });

    } catch (error) {
      console.error('Minting failed:', error);
      setStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to mint tokens',
        signature: null,
      });
    }
  };

  if (tokenCount <= 0) return null;

  // Show loading state while verifying
  if (!hasFetched || verifiedCount === null) {
    return (
      <div className='mb-8 text-center'>
        <p className='text-gray-400'>Verifying collected tokens...</p>
      </div>
    );
  }

  // Show mismatch warning if counts don't match
  if (verifiedCount !== tokenCount) {
    return (
      <div className='mb-8 text-center'>
        <p className='text-yellow-400'>Token verification mismatch. Please try again.</p>
        <p className='text-sm text-gray-400'>
          Client: {tokenCount}, Server: {verifiedCount}
        </p>
      </div>
    );
  }

  return (
    <div className='mb-8 space-y-4'>
      <div className='text-lg mb-4'>
        <span className='text-game-blue'>Verified Tokens:</span> {verifiedCount}
      </div>

      <button
        onClick={mintGameTokens}
        disabled={status.loading || !publicKey || status.signature !== null}
        className={`w-full px-4 py-2 bg-game-blue text-black
          ${status.loading || !publicKey || status.signature
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-white'
          }`}
      >
        {!publicKey
          ? 'Connect Wallet to Claim'
          : status.loading
            ? 'Minting...'
            : status.signature
              ? 'Tokens Claimed!'
              : `Claim ${verifiedCount} ASTRDS`}
      </button>

      {status.error && (
        <div className='text-red-500 text-sm bg-red-500/10 p-3 rounded border border-red-500/20'>
          {status.error}
        </div>
      )}

      {status.signature && (
        <div className='text-green-500 text-sm bg-green-500/10 p-3 rounded border border-green-500/20'>
          <div className='mb-2'>Tokens successfully minted!</div>
          <a
            href={`https://explorer.solana.com/tx/${status.signature}?cluster=devnet`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 hover:underline inline-flex items-center gap-1'
          >
            View on Solana Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default ASTRDSMinting;
