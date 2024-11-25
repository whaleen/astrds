export const getHighScores = async () => {
  // console.log('getHighScores called');
  try {
    // console.log('Fetching scores...');
    const response = await fetch('/api/getScores');  // Updated path
    // console.log('Response:', response.status);
    const text = await response.text();
    // console.log('Raw response:', text);
    const data = JSON.parse(text);
    // console.log('Parsed data:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching scores:', error);
    return [];
  }
};

export const submitScore = async (score, walletAddress) => {
  // console.log('submitScore called', { score, walletAddress });
  try {
    // console.log('Submitting score...');
    const response = await fetch('/api/postScore', {  // Updated path
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score, walletAddress }),
    });
    // console.log('Submit response status:', response.status);
    const text = await response.text();
    // console.log('Raw response:', text);
    const data = JSON.parse(text);
    // console.log('Parsed data:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error submitting score:', error);
    return [];
  }
};
