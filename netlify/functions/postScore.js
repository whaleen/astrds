// Shared scores array (note: this will reset on cold starts)
const scores = [];

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    console.log('Existing scores:', scores);
    const { score, walletAddress } = JSON.parse(event.body);

    // Add new score
    const newScore = {
      score,
      walletAddress,
      date: new Date().toISOString()
    };

    // Update scores array
    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score);
    while (scores.length > 10) {
      scores.pop();
    }

    console.log('Updated scores:', scores);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scores)
    };
  } catch (error) {
    console.error('Error in postScore:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to save score', details: error.message })
    };
  }
};
