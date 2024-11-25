// netlify/functions/getGame.js
import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { sessionId } = event.queryStringParameters;
    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Session ID is required' })
      };
    }

    const store = getStore({
      name: "site:game-sessions",
      siteID: process.env.SITE_ID,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const sessionsData = await store.get("sessions");
    if (!sessionsData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No sessions found' })
      };
    }

    const sessions = JSON.parse(sessionsData);
    const session = sessions.active[sessionId] || sessions.archived[sessionId];

    if (!session) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Session not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(session)
    };

  } catch (error) {
    console.error('Error getting game session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get game session',
        details: error.message
      })
    };
  }
};
