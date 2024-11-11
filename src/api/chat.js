// src/api/chat.js
export const getChatMessages = async () => {
  try {
    const response = await fetch('/api/getChatMessages');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
};

export const postChatMessage = async (walletAddress, message) => {
  try {
    const response = await fetch('/api/postChatMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress, message }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error posting chat message:', error);
    return [];
  }
};
