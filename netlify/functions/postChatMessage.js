// netlify/functions/postChatMessage.js
import Pusher from 'pusher';
import { getStore } from "@netlify/blobs";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  const metrics = {
    startTime: Date.now(),
    blobStorageTime: 0,
    pusherTime: 0,
    totalTime: 0
  };

  try {
    const { walletAddress, message } = JSON.parse(event.body);

    const newMessage = {
      id: Date.now().toString(),
      walletAddress,
      message,
      timestamp: new Date().toISOString()
    };

    console.log('Starting message processing:', newMessage.id);

    const store = getStore({
      name: "game:chat",
      siteID: process.env.SITE_ID,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // Measure blob storage operation
    const blobStart = Date.now();
    const existingMessagesStr = await store.get("messages");
    const existingMessages = existingMessagesStr ? JSON.parse(existingMessagesStr) : [];
    await store.set("messages", JSON.stringify([...existingMessages, newMessage].slice(-100)));
    metrics.blobStorageTime = Date.now() - blobStart;

    // Measure Pusher operation
    const pusherStart = Date.now();
    await pusher.trigger('game-chat', 'new-message', newMessage);
    metrics.pusherTime = Date.now() - pusherStart;

    metrics.totalTime = Date.now() - metrics.startTime;

    // Log performance metrics
    console.log('Message processing metrics:', {
      messageId: newMessage.id,
      blobStorageTime: `${metrics.blobStorageTime}ms`,
      pusherTime: `${metrics.pusherTime}ms`,
      totalTime: `${metrics.totalTime}ms`
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: newMessage,
        metrics
      })
    };
  } catch (error) {
    metrics.totalTime = Date.now() - metrics.startTime;
    console.error('Error posting message:', {
      error: error.message,
      metrics
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to post message',
        details: error.message,
        metrics
      })
    };
  }
};
