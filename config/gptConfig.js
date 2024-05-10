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

module.exports = {
  setupChatGPTAPI,
  getChatGPTAPI
}