import { Context } from "@netlify/functions";

exports.handler = async function (event, context) {
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
    const { score, walletAddress } = JSON.parse(event.body);

    // Get existing scores
    const existingScores = JSON.parse(await context.store.get('highScores') || '[]');

    // Add new score
    const newScore = {
      score,
      walletAddress,
      date: new Date().toISOString()
    };

    // Add to list and sort, keep top 10
    const allScores = [...existingScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Save updated scores
    await context.store.set('highScores', JSON.stringify(allScores));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(allScores)
    };
  } catch (error) {
    console.error('Error saving score:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to save score', details: error.message })
    };
  }
};
