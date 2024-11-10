export const getHighScores = async () => {
  try {
    const response = await fetch('/.netlify/functions/getScores');
    if (!response.ok) throw new Error('Failed to fetch scores');
    return await response.json();
  } catch (error) {
    console.error('Error fetching scores:', error);
    return [];
  }
};

export const submitScore = async (score, walletAddress) => {
  try {
    const response = await fetch('/.netlify/functions/postScore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score, walletAddress }),
    });

    if (!response.ok) throw new Error('Failed to submit score');
    return await response.json();
  } catch (error) {
    console.error('Error submitting score:', error);
    return null;
  }
};
