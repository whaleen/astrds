exports.handler = async function (event, context) {
  console.log('getScores function called', { httpMethod: event.httpMethod });

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
    const scores = []; // Empty for now
    console.log('Returning scores:', scores);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scores)
    };
  } catch (error) {
    console.error('Error in getScores:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch scores' })
    };
  }
};
