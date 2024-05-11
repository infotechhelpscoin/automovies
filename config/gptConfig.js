let ChatGPTAPI = null;

 async function setupChatGPTAPI() {
    if (!ChatGPTAPI) {
        const module = await import('chatgpt');
        ChatGPTAPI = module.ChatGPTAPI;
    }
    return ChatGPTAPI;
}

 function getChatGPTAPI() {
    return ChatGPTAPI;
}

async function ensureChatGPTAPI() {
  if (!getChatGPTAPI()) {
      await setupChatGPTAPI();
  }
  return getChatGPTAPI();
}


module.exports = {
  setupChatGPTAPI,
  getChatGPTAPI,
  ensureChatGPTAPI,
  ChatGPTAPI
}