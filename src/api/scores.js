export const getHighScores = async () => {
  try {
    const response = await fetch('/.netlify/functions/getScores');
    console.log('Fetching scores response:', response.status);
    const data = await response.text();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('Failed to fetch scores:', data);
      throw new Error('Failed to fetch scores');
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return [];
  }
};

export const submitScore = async (score, walletAddress) => {
  try {
    console.log('Submitting score:', { score, walletAddress });
    const response = await fetch('/.netlify/functions/postScore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score, walletAddress }),
    });

    console.log('Submit score response:', response.status);
    const data = await response.text();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('Failed to submit score:', data);
      throw new Error('Failed to submit score');
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error submitting score:', error);
    return null;
  }
};
