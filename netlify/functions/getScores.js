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
    const scoresPath = path.join('/tmp', 'scores.json');
    let scores = [];

    if (fs.existsSync(scoresPath)) {
      scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scores)
    };
  } catch (error) {
    console.error('Error in getScores:', error);
    return {
      statusCode: 200, // Return 200 even on error, with empty array
      headers,
      body: JSON.stringify([])
    };
  }
};
