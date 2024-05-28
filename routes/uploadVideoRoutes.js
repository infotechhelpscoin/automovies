const express = require('express');
const router = express.Router();
router.use(express.json());
const { getCollections } = require('../mongoConnection');
const { google } = require('googleapis');
const { refreshAccessToken, oAuth2Client } = require('../config/googleOAuth');
const { downloadVideoFromCloudinary } = require('../utilities/upload');
const { default: axios } = require('axios');

router.post('/upload_video', async(req, res) => {
  const {scheduleDateTime, videoLink, title,thumbnailUrl,tags,description, email } = req.body;
  console.log('reqbody', req.body)
  console.log('all', scheduleDateTime, videoLink, title,thumbnailUrl,tags,description, email)

  const fs = require('fs-extra');
  const path = require('path');
  

  const tempFolder = path.join(__dirname, '../tempFolder');
  const videoFileName = path.basename(videoLink);
  const videoFilePath = path.join(tempFolder, videoFileName);

  const thumbnailFileName = path.basename(thumbnailUrl);
  const thumbnailFilePath = path.join(tempFolder, thumbnailFileName);

  console.log('temp', tempFolder)

  const {
    scheduleCollection,
    seriesCollection,
    userCollection,
    midjourneyImageCollection,
  } = await getCollections();

  const refreshToken = await userCollection.findOne({email:email}, { projection: { refreshToken: 1, googleId: 1 } })

  if (!refreshToken) {
    throw new Error('Failed to obtain access token');
  }

   await downloadVideoFromCloudinary(videoLink, videoFilePath)

  //  download thumbnail image

  const response = await axios({
    url: thumbnailUrl,
    method: 'GET',
    responseType: 'stream',
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(thumbnailFilePath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('refreshToken', refreshToken);
  console.log('videoFilePath', videoFilePath);
  console.log('thumbnailFilePath', thumbnailFilePath);

  try {

    const newAccessToken = await refreshAccessToken(refreshToken.refreshToken);

    console.log("New Access Token:", newAccessToken);

    oAuth2Client.setCredentials({
      access_token: newAccessToken,
      refresh_token: refreshToken.refreshToken,
    });

    

    const youtube = google.youtube({ version: 'v3', auth: oAuth2Client, });

    const videoMetadata = {
      snippet: {
        title: title,
        description: description,
        tags: tags,
        categoryId: '22', 
        thumbnails: {
          default: {
            url: thumbnailUrl,
          },
        },
      },
      status: {
        privacyStatus: 'private',
        publishAt: new Date(scheduleDateTime).toISOString(),
      },
    };

    // Upload the video
    const videoResponse = await youtube.videos.insert({
      part: 'snippet,status',
      resource: videoMetadata,
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    });

    console.log('Video uploaded:', videoResponse.data);

// Set the thumbnail
const thumbnailResponse = await youtube.thumbnails.set({
  videoId: videoResponse.data.id,
  media: {
    body: fs.createReadStream(thumbnailFilePath),
  },
});

console.log('Thumbnail uploaded:', thumbnailResponse.data);


    res.status(200).json({ message: 'Video scheduled for upload successfully', videoId: videoResponse.data.id });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ message: 'Error uploading video', error: error.message });
  }

})



module.exports = router;