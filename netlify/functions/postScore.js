exports.handler = async function (event, context) {
  console.log('postScore function called', {
    httpMethod: event.httpMethod,
    body: event.body
  });

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
    console.log('Processing score submission:', { score, walletAddress });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, score, walletAddress })
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
