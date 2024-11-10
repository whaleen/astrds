// Shared scores array (note: this will reset on cold starts)
global.scores = global.scores || [];

exports.handler = async function (event) {
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
    console.log('Existing scores:', global.scores);
    const { score, walletAddress } = JSON.parse(event.body);

    // Add new score
    const newScore = {
      score,
      walletAddress,
      date: new Date().toISOString()
    };

    // Add to list and sort, keep top 10
    global.scores = [...global.scores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log('Updated scores:', global.scores);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(global.scores)
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
