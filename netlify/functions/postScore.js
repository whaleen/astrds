const fs = require('fs');
const path = require('path');

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
    const { score, walletAddress } = JSON.parse(event.body);
    const scoresPath = path.join('/tmp', 'scores.json');

    // Read existing scores
    let scores = [];
    if (fs.existsSync(scoresPath)) {
      scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
    }

    // Add new score
    const newScore = {
      score,
      walletAddress,
      date: new Date().toISOString()
    };

    // Add to list and sort, keep top 10
    scores = [...scores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Save back to file
    fs.writeFileSync(scoresPath, JSON.stringify(scores));

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
