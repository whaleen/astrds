let scores = [];

export default async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { score, walletAddress } = JSON.parse(event.body);

    if (typeof score !== 'number' || score < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid score' })
      };
    }

    // Add new score
    const newScore = {
      score,
      walletAddress: walletAddress || 'Anonymous',
      date: new Date().toISOString()
    };

    // Add to list and sort, keep top 10
    scores = [...scores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scores)
    };
  } catch (error) {
    console.error('Error saving score:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to save score' })
    };
  }
}
