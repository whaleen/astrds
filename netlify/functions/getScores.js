import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    console.log('Getting blob store...');
    const store = getStore({
      name: "site:high-scores",
    });

    const { score, walletAddress } = JSON.parse(event.body);
    console.log('Received score:', { score, walletAddress });

    // Get existing scores
    const existingScoresStr = await store.get("scores");
    const existingScores = existingScoresStr ? JSON.parse(existingScoresStr) : [];
    console.log('Current scores:', existingScores);

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

    console.log('Saving updated scores:', allScores);
    await store.set("scores", JSON.stringify(allScores));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(allScores)
    };
  } catch (error) {
    console.error('Error saving score:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to save score', details: error.message })
    };
  }
};
