// src/screens/leaderboard/LeaderboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getHighScores } from '../../api/scores';
import LeaderboardTable from './LeaderboardTable';
import { useGameData } from '../../stores/gameData';
import { LeaderboardScreenProps } from '@/types/components/leaderboard';
import { Score } from '@/types/core';
import { useStateMachine } from '@/stores/stateMachine';
import { MachineState } from '@/types/machine'

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  isOverlay = false,
  onClose,
  onPlayAgain
}) => {
  const wallet = useWallet();
  const topScore = useGameData((state) => state.topScore);
  const selectMachineState = useStateMachine((state) => state.setState);


  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<{
    topScore: number;
    rank: number | null;
  }>({
    topScore: 0,
    rank: null,
  });



  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const highScores = await getHighScores();

        if (!Array.isArray(highScores)) {
          console.error('Invalid scores data:', highScores);
          throw new Error('Invalid scores data received');
        }

        setScores(highScores);

        if (wallet.publicKey) {
          const walletAddress = wallet.publicKey.toString();
          const playerScores = highScores.filter(
            (s) => s.walletAddress === walletAddress
          );

          if (playerScores.length > 0) {
            const bestScore = Math.max(...playerScores.map((s) => s.score));
            const bestRank =
              highScores.findIndex(
                (s) =>
                  s.walletAddress === walletAddress && s.score === bestScore
              ) + 1;

            setPlayerStats({
              topScore: bestScore,
              rank: bestRank > 0 ? bestRank : null,
            });

            if (bestScore > topScore) {
              useGameStore.getState().updateScore(bestScore);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch scores:', err);
        setError('Failed to load high scores');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [wallet.publicKey, topScore]);

  const handlePlayAgain = () => {
    selectMachineState(MachineState.READY_TO_PLAY);
  };

  const handleLocalPlayAgain = () => {
    if (onPlayAgain) {
      onPlayAgain();
    } else {
      selectMachineState(MachineState.READY_TO_PLAY);
    }
  };

  const formatRank = (rank: number | null) => {
    if (!rank) return null;
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;
    let suffix = 'th';

    if (lastTwoDigits < 11 || lastTwoDigits > 13) {
      switch (lastDigit) {
        case 1:
          suffix = 'st';
          break;
        case 2:
          suffix = 'nd';
          break;
        case 3:
          suffix = 'rd';
          break;
      }
    }

    return `${rank}${suffix}`;
  };

  return (
    <div className='inset-0 flex items-center justify-center z-40 bg-black/75 backdrop-blur-sm'>
      <div className='w-full min-h-screen py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='space-y-6'>
              <div className='bg-black/50 border border-white/10 rounded-lg p-6'>
                <h2 className='text-xl text-game-blue mb-4'>Your Stats</h2>
                <div className='space-y-4'>
                  {wallet.connected ? (
                    <>
                      <div className='flex justify-between items-center'>
                        <span className='text-white/80'>Your Top Score:</span>
                        <span className='text-xl font-mono text-game-blue'>
                          {playerStats.topScore.toLocaleString()}
                        </span>
                      </div>
                      {playerStats.rank && (
                        <div className='flex justify-between items-center'>
                          <span className='text-white/80'>Your Best Rank:</span>
                          <span className='text-xl font-mono text-game-blue'>
                            {formatRank(playerStats.rank)}
                          </span>
                        </div>
                      )}
                      {!playerStats.rank && playerStats.topScore > 0 && (
                        <div className='text-center text-gray-400 text-sm'>
                          Keep playing to reach the top 100!
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='text-center text-gray-400'>
                      Connect wallet to see your stats
                    </div>
                  )}
                </div>
              </div>

              <div className='bg-black/50 border border-white/10 rounded-lg p-6'>
                <h3 className='text-lg text-game-blue mb-3'>Pro Tips</h3>
                <ul className='space-y-2 text-sm text-white/80'>
                  <li>• Smaller asteroids are worth more points</li>
                  <li>• Collect power-ups to enhance your ship</li>
                  <li>• Use chat to connect with other players</li>
                  <li>• Press [P] to pause and view controls</li>
                </ul>
              </div>
            </div>

            <div className='bg-black/50 border border-white/10 rounded-lg p-6 max-h-[70vh] overflow-y-auto'>
              <h2 className='text-xl text-game-blue mb-4'>
                Global Leaderboard{' '}
                {scores.length > 0 && `(Top ${scores.length})`}
              </h2>
              {error ? (
                <div className='text-red-400 text-center py-4 bg-red-400/10 rounded border border-red-400/20'>
                  {error}
                  <button
                    onClick={handleLocalPlayAgain}
                    className='block mx-auto mt-2 text-sm text-red-400 hover:text-red-300'
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <LeaderboardTable
                  scores={scores}
                  loading={loading}
                  playerWallet={wallet.publicKey?.toString()}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
