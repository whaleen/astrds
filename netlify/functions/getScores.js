// getScores.js
import { getStore } from "@netlify/blobs";

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    console.log('Function context:', {
      siteId: context.site.id,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
    });

    const store = getStore({
      name: "site:high-scores",
      siteID: context.site.id,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log('Store config:', {
      name: "site:high-scores",
      siteID: context.site.id,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log('Fetching scores...');
    const scoresData = await store.get("scores");
    console.log('Retrieved scores:', scoresData);

    return {
      statusCode: 200,
      headers,
      body: scoresData || "[]"
    };
  } catch (error) {
    console.error('Error getting scores:', {
      error: error.message,
      context: context ? 'exists' : 'missing',
      siteId: context?.site?.id || 'missing',
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get scores',
        details: error.message,
        debug: {
          hasSiteId: !!context?.site?.id,
          hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
        }
      })
    };
  }
};
