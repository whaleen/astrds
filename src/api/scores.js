export const getHighScores = async () => {
  try {
    const response = await fetch('/.netlify/functions/getScores');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
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

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error submitting score:', error);
    return [];
  }
};
