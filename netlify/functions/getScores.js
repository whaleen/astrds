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
    console.log('Current scores:', global.scores);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(global.scores)
    };
  } catch (error) {
    console.error('Error in getScores:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([])
    };
  }
};
