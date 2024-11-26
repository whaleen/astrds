// netlify/functions/postGame.js
import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { walletAddress } = JSON.parse(event.body);
    if (!walletAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Wallet address is required' })
      };
    }

    const store = getStore({
      name: "game-sessions",
      siteID: process.env.SITE_ID,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // Get existing sessions
    let sessions;
    try {
      const sessionsData = await store.get("sessions");
      sessions = sessionsData ? JSON.parse(sessionsData) : { active: {}, archived: {} };
    } catch (error) {
      sessions = { active: {}, archived: {} };
    }

    // Clean up stale sessions (older than 5 minutes)
    const now = Date.now();
    Object.entries(sessions.active).forEach(([id, session]) => {
      const lastUpdate = new Date(session.lastUpdated).getTime();
      if (now - lastUpdate > 5 * 60 * 1000) {
        session.sessionEnd = new Date().toISOString();
        sessions.archived[id] = session;
        delete sessions.active[id];
      }
    });

    // Create new session with composite ID
    const sessionId = `session-${Date.now()}-${Math.random()}`;
    const newSession = {
      id: sessionId,
      walletAddress,
      score: 0,
      tokensEarned: [],
      levelReached: 1,
      sessionStart: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    sessions.active[sessionId] = newSession;

    // Save updated sessions
    await store.set("sessions", JSON.stringify(sessions));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        session: newSession
      })
    };

  } catch (error) {
    console.error('Error creating game session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create game session',
        details: error.message
      })
    };
  }
};
