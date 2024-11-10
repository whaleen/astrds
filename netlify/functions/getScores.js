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
    // Get scores from KV store
    const scores = await context.store.get('highScores') || '[]';

    return {
      statusCode: 200,
      headers,
      body: scores
    };
  } catch (error) {
    console.error('Error fetching scores:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch scores' })
    };
  }
};
