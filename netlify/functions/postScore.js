exports.handler = async function (event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    const { score, walletAddress } = JSON.parse(event.body);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, score, walletAddress })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to save score' })
    };
  }
};
