// netlify/functions/updateGame.js
import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { sessionId, update } = JSON.parse(event.body);
    if (!sessionId || !update) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Session ID and update data required' })
      };
    }

    const store = getStore({
      name: "game-sessions",
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
    if (!sessions.active[sessionId]) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Session not found' })
      };
    }

    sessions.active[sessionId] = {
      ...sessions.active[sessionId],
      ...update,
      lastUpdated: new Date().toISOString()
    };

    if (update.sessionEnd) {
      sessions.archived[sessionId] = sessions.active[sessionId];
      delete sessions.active[sessionId];
    }

    await store.set("sessions", JSON.stringify(sessions));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sessions.active[sessionId] || sessions.archived[sessionId])
    };

  } catch (error) {
    console.error('Error updating game session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update game session',
        details: error.message
      })
    };
  }
};
