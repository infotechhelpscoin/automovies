const { getCollections } = require("../mongoConnection");
// const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { getAudioDuration, generateVoice } = require("./audio");

const imagesDir = path.join(__dirname, "..", "tempFolder");
// Ensure the directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function getAllMidjourneyData(topicId) {
  try {
    const { midjourneyImageCollection } = await getCollections();
    const documents = await midjourneyImageCollection
      .find({ topicId: topicId })
      .project({ _id: 0, upscaleImage_url: 1, quote: 1, topic: 1 })
      .limit(5)
      .toArray();

      if (documents.length === 0) {
        throw new Error(`Data for topicId ${topicId} could not download.`);
      }

    console.log("midjourney data doc", documents);

    const images = [];
    const quotes = [];

    documents.forEach((doc) => {
      images.push(doc.upscaleImage_url);
      quotes.push(doc.quote);
    });

    const imageFileNames = [];

      // Loop through the images array and download each image
    for (let i = 0; i < images.length; i++) {
      const filename = await downloadImage(images[i], i, topicId);
      imageFileNames.push(filename);
    }
    // console.log('Downloaded images:', imageFileNames);

    const generatedFiles = [];

    for (let i = 0; i < quotes.length; i++) {
      const quote = quotes[i];
      const { audio, captions } = await generateVoice(quote, topicId, i);

      if (audio && captions) {
        const audioDir = path.join(__dirname, "..", "tempFolder");
        const audioPath = path.join(audioDir, audio);

        // Calculate audio duration for each audio file
        const audioDuration = await getAudioDuration(audioPath);

        // Add the audio duration to the generatedFiles array
        generatedFiles.push({
          audio,
          captions,
          image: imageFileNames[i],
          duration: audioDuration,
        });

        // console.log(`Voice generated for quote: ${quote}`);
      } else {
        console.log(`Error generating voice for quote: ${quote}`);
      }
    }
    console.log("Generated file from database", generatedFiles);

    return generatedFiles;

    
  } catch (error) {
    console.error("Error generating voice or processing data:", error);
    
  throw new Error(`Error in getAllMidjourneyData for topicId ${topicId}: ${error.message}`);
  }
}


async function downloadImage(url, index, topicId) {
  const imageFilename = `image_${topicId}_${index + 1}.jpg`;

  console.log("download image file name", imageFilename);

  const imagePath = path.join(imagesDir, imageFilename);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image from ${url}: Status ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(imagePath, Buffer.from(buffer));

    console.log(`Downloaded and saved image: ${imageFilename}`);

    return imageFilename;
  } catch (error) {
    console.error(`Error in downloadImage function: ${error.message}`);
    throw new Error(`Could not download or save image ${imageFilename}: ${error.message}`);
  }

  }

  module.exports = { getAllMidjourneyData };


  