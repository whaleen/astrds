// netlify/functions/postChatMessage.js
import { getStore } from "@netlify/blobs";

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const store = getStore({
      name: "game:chat",
      siteID: process.env.SITE_ID,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const { walletAddress, message } = JSON.parse(event.body);

    // Get existing messages
    const existingMessagesStr = await store.get("messages");
    const existingMessages = existingMessagesStr ? JSON.parse(existingMessagesStr) : [];

    // Add new message
    const newMessage = {
      id: Date.now().toString(),
      walletAddress,
      message,
      timestamp: new Date().toISOString()
    };

    // Keep only last 100 messages
    const updatedMessages = [...existingMessages, newMessage].slice(-100);

    await store.set("messages", JSON.stringify(updatedMessages));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedMessages)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to post message' })
    };
  }
};
