// src/screens/title/PaymentModal.tsx
import React, { memo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Coins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FormProps } from '@/types/forms';

interface PaymentOptionProps {
  selected: boolean;
  onSelect: (paymentType: string) => void;
  type: string;
  amount: number;
  symbol: string;
  label: string;
}

const PaymentOption = memo(({ selected, onSelect, type, amount, symbol, label }: PaymentOptionProps) => (
  <button
    onClick={() => onSelect(type)}
    className={`w-full p-4 border-2 rounded-lg transition-all duration-200 flex items-center justify-between
      ${selected
        ? 'border-game-blue bg-game-blue/10 text-white'
        : 'border-white/10 hover:border-game-blue/50 text-gray-400 hover:text-white'
      }`}
  >
    <div className='flex items-center gap-3'>
      <Coins
        size={20}
        className={selected ? 'text-game-blue' : 'text-gray-500'}
      />
      <div className='text-left'>
        <div className='font-mono'>
          {amount.toLocaleString()} {symbol}
        </div>
        <div className='text-xs opacity-60'>{label}</div>
      </div>
    </div>
    <div
      className={`w-4 h-4 rounded-full border-2 transition-colors
      ${selected ? 'border-game-blue bg-game-blue' : 'border-gray-500'}`}
    />
  </button>
));

const PaymentModal = memo((props: FormProps) => {
  const { isVisible, selectedOption, onSelect, onSubmit, onClose, error } = props;
  const wallet = useWallet();
  const { isVerifying: authVerifying } = useAuth();

  if (!isVisible) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm'>
      <div className='w-full max-w-md mx-4 bg-black/90 border border-game-blue p-8 rounded-lg'>
        <h2 className='text-xl text-game-blue mb-6 flex items-center gap-2'>
          <Coins size={24} />
          Insert Quarter
        </h2>

        <div className='space-y-4 mb-8'>
          <PaymentOption
            type='SOL'
            amount={0.05}
            symbol='SOL'
            label='Pay with SOL'
            selected={selectedOption === 'SOL'}
            onSelect={onSelect}
          />
          <PaymentOption
            type='ASTRDS'
            amount={1000}
            symbol='ASTRDS'
            label='Pay with ASTRDS'
            selected={selectedOption === 'ASTRDS'}
            onSelect={onSelect}
          />
        </div>

        {error && (
          <div className='text-red-400 text-sm text-center mb-4'>{error}</div>
        )}

        <div className='flex gap-4'>
          <button
            onClick={onSubmit}
            disabled={!wallet.connected || authVerifying || !selectedOption}
            className={`flex-1 py-3 border-2 transition-colors font-arcade text-sm
              ${!wallet.connected || authVerifying || !selectedOption
                ? 'border-gray-600 text-gray-600 cursor-not-allowed'
                : 'border-game-blue text-game-blue hover:bg-game-blue hover:text-black'
              }`}
          >
            {!wallet.connected
              ? 'Connect Wallet'
              : authVerifying
                ? 'Verifying...'
                : !selectedOption
                  ? 'Select Payment Method'
                  : 'Pay'}
          </button>
          <button
            onClick={onClose}
            className='px-6 py-3 border-2 border-white/10 text-gray-400 
                     hover:border-white/30 hover:text-white transition-colors font-arcade text-sm'
          >
            Cancel
          </button>
        </div>

        <div className='mt-4 text-center text-xs text-gray-500'>
          {wallet.connected
            ? 'Choose your preferred payment method'
            : 'Connect your wallet to continue'}
        </div>
      </div>
    </div>
  );
});

export default PaymentModal;
