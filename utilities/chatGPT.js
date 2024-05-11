const {channel} = require('../config/channel')

function modifyChannelForGPT(topic) {
  return {
    ...channel, // Assuming 'channel' is accessible in this context; otherwise, it should be passed as a parameter
    Motivation: {
      ...channel.Motivation,
      GetStoriesList: channel.Motivation.GetStoriesList.replace("{topicName}", topic).replace("{topicCount}", "1"),
    },
  };
}

module.exports = {modifyChannelForGPT};