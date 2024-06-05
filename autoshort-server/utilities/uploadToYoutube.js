const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { oAuth2Client } = require('../config/googleOAuth');
const { getCollections } = require('../mongoConnection');


async function uploadToYouTube(topicId) {
  
  const { midjourneyImageCollection } = await getCollections();
  const youtube = google.youtube({
    version: "v3",
    auth: oAuth2Client,
  });
  const videoFileName = `${topicId}_finalVideo.mp4`;
  const videoFilePath = path.join(__dirname,'..', '/tempFolder', videoFileName);
  const title = await midjourneyImageCollection.findOne(
    { topicId },
    { projection: { topic: 1, _id: 0 } }
  );
  console.log("title", title.topic);

  if (!title || !title.topic) {
    throw new Error(`Title for topicId ${topicId} not found or is undefined.`);
  }
  
  if (!fs.existsSync(videoFilePath)) {
    throw new Error(`Video file does not exist at the specified path for topic is ${topicId}`);
  }

try {
  const response = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: title.topic,
      },
      status: {
        privacyStatus: "private",
      },
    },
    media: {
      body: fs.createReadStream(videoFilePath),
    },
  });
  // console.log("YouTube response", response);
  console.log(
    `Video uploaded with ID: ${
      response.data.id
    } on ${new Date().toLocaleString()} for topic id: ${topicId}`
  );
  return response.data.id
} catch (error) {
  throw new Error(`Failed to upload to YouTube: ${error.message} for topic id: ${topicId}`);
}
}

module.exports= {uploadToYouTube}