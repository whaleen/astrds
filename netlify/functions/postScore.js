// postScore.js
import { getStore } from "@netlify/blobs";

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    let siteId;
    if (context && context.site && context.site.id) {
      siteId = context.site.id;
    } else if (process.env.SITE_ID) {
      siteId = process.env.SITE_ID;
    } else {
      throw new Error("Site ID is missing from the environment variables or the context object.");
    }

    const store = getStore({
      name: "high-scores",
      siteID: siteId,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const { score, walletAddress } = JSON.parse(event.body);
    // console.log('Processing new score:', { score, walletAddress });

    // Get existing scores
    const existingScoresStr = await store.get("scores");
    const existingScores = existingScoresStr ? JSON.parse(existingScoresStr) : [];
    // console.log('Current scores:', existingScores);

    // Add new score
    const newScore = {
      score,
      walletAddress,
      date: new Date().toISOString()
    };

    // Update scores
    const allScores = [...existingScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // console.log('Saving updated scores:', allScores);
    await store.set("scores", JSON.stringify(allScores));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(allScores)
    };
  } catch (error) {
    console.error('Error saving score:', {
      error: error.message,
      context: context ? 'exists' : 'missing',
      siteId: context?.site?.id || 'missing',
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to save score',
        details: error.message,
        debug: {
          hasSiteId: !!context?.site?.id,
          hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
        }
      })
    };
  }
};
