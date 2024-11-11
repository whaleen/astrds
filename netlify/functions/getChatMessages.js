// netlify/functions/getChatMessages.js
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

    const messagesData = await store.get("messages");
    const messages = messagesData ? JSON.parse(messagesData) : [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(messages)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get messages' })
    };
  }
};
