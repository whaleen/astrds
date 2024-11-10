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
    console.log('Current scores:', scores);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scores)
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
