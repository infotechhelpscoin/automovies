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



async function getAllMidjourneyData(topicId, document) {
  let generatedFiles = [];
  try {
    
    const images = [];
    const quotes = [];

    document.images.forEach((doc) => {
      images.push(doc.upscaleImage_url);
      quotes.push(doc.quote);
    });

    const imageFileNames = [];

      // Loop through the images array and download each image
    for (let i = 0; i < images.length; i++) {
      const filename = await downloadImage(images[i], i, topicId);
      imageFileNames.push(filename);
    }

    // const generatedFiles = [];
// todo only for audio file
    for (let i = 0; i < quotes.length; i++) {
      const quote = quotes[i];
      const { audio } = await generateVoice(quote, topicId, i);

      if (audio) {
        const audioDir = path.join(__dirname, "..", "tempFolder");
        const audioPath = path.join(audioDir, audio);

        // Calculate audio duration for each audio file
        const audioDuration = await getAudioDuration(audioPath);

        // Add the audio duration to the generatedFiles array
        generatedFiles.push({
          audio,
          image: imageFileNames[i],
          duration: audioDuration,
        });

      } else {
        console.log(`Error generating voice for quote: ${quote}`);
      }
    }
    // todo for audio file and caption
    // for (let i = 0; i < quotes.length; i++) {
    //   const quote = quotes[i];
    //   const { audio, captions } = await generateVoice(quote, topicId, i);

    //   if (audio && captions) {
    //     const audioDir = path.join(__dirname, "..", "tempFolder");
    //     const audioPath = path.join(audioDir, audio);

    //     // Calculate audio duration for each audio file
    //     const audioDuration = await getAudioDuration(audioPath);

    //     // Add the audio duration to the generatedFiles array
    //     generatedFiles.push({
    //       audio,
    //       captions,
    //       image: imageFileNames[i],
    //       duration: audioDuration,
    //     });

    //     // console.log(`Voice generated for quote: ${quote}`);
    //   } else {
    //     console.log(`Error generating voice for quote: ${quote}`);
    //   }
    // }
    
  } catch (error) {
    console.error("Error generating voice or processing data:", error);
    
  throw new Error(`Error in getAllMidjourneyData for topicId ${topicId}: ${error.message}`);
  }
  
  return generatedFiles;
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


  const topicId = '38ead003-70a7-490e-bc1c-b1f79a1fe9d3'

  const document = {
    _id: {
      $oid: "6640e0ac788e5c742a1eea3f"
    },
    seriesId: "6640df54788e5c742a1eea3d",
    seriesName: "Bedtime Stories",
    refreshToken: "1//061XU-lI9OrzLCgYIARAAGAYSNwF-L9IrGPUQftLZCQyFXlUUjEeZ_ZJ2vvafQu6PltPpBq_mzjtA2wsvlGOXDI8Xmg3PCfeJOe8",
    status: "imageGenerated",
    scheduleTime: {
      $date: "2024-05-12T16:30:52.075Z"
    },
    lastRunTime: null,
    result: null,
    images: [
      {
        topic: "Success and Happiness",
        quote: "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.",
        prompt: "Generate an image that conveys the idea of happiness being the key to success with a background symbolizing achievement or contentment.",
        topicId: "38ead003-70a7-490e-bc1c-b1f79a1fe9d3",
        imageId: "342ac1b1-277b-43b1-9dbd-29ae9eff4633",
        status: "finished",
        scheduleTaskId: "6640e0ac788e5c742a1eea3f",
        task_id: "f650d45a-ca74-46c9-849f-da676946b20b",
        image_url: "https://img.midjourneyapi.xyz/mj/f650d45a-ca74-46c9-849f-da676946b20b.png",
        upscaleTaskId: "cd936560-1d13-4d5c-b33b-16f72e836e83",
        upscaleImage_url: "https://img.midjourneyapi.xyz/mj/cd936560-1d13-4d5c-b33b-16f72e836e83.png"
      },
      {
        topic: "Passion and Work",
        quote: "The only way to do great work is to love what you do.",
        prompt: "Generate an image with a background that conveys passion and enthusiasm, overlaying the quote in an elegant font.",
        topicId: "38ead003-70a7-490e-bc1c-b1f79a1fe9d3",
        imageId: "aca7a265-f467-4d85-9afb-691ba2db5de2",
        status: "finished",
        scheduleTaskId: "6640e0ac788e5c742a1eea3f",
        task_id: "0d60141a-e03b-4381-af15-59e190b5b0ae",
        image_url: "https://img.midjourneyapi.xyz/mj/0d60141a-e03b-4381-af15-59e190b5b0ae.png",
        upscaleTaskId: "3a93b1c6-6f45-4fbd-8a08-59967be24123",
        upscaleImage_url: "https://img.midjourneyapi.xyz/mj/3a93b1c6-6f45-4fbd-8a08-59967be24123.png"
      },
      {
        topic: "Happiness and Achievement",
        quote: "Happiness lies in the joy of achievement and the thrill of creative effort.",
        prompt: "Generate an image that represents the joy of achievement and the thrill of creative effort. Be creative with colors and design to convey a sense of happiness and accomplishment.",
        topicId: "38ead003-70a7-490e-bc1c-b1f79a1fe9d3",
        imageId: "162d0347-6b02-471c-8333-e8115c63f953",
        status: "finished",
        scheduleTaskId: "6640e0ac788e5c742a1eea3f",
        task_id: "804a7ae0-a4b2-40a7-817e-cf4ab951641d",
        image_url: "https://img.midjourneyapi.xyz/mj/804a7ae0-a4b2-40a7-817e-cf4ab951641d.png",
        upscaleTaskId: "4862a28a-cb7e-4e08-a60d-e616d0a1ebb4",
        upscaleImage_url: "https://img.midjourneyapi.xyz/mj/4862a28a-cb7e-4e08-a60d-e616d0a1ebb4.png"
      },
      {
        topic: "Passion and Energy",
        quote: "Passion is energy. Feel the power that comes from focusing on what excites you.",
        prompt: "Create an image that visualizes the concept of energy and passion, perhaps using vibrant colors and dynamic shapes to convey a sense of excitement.",
        topicId: "38ead003-70a7-490e-bc1c-b1f79a1fe9d3",
        imageId: "f32693f7-873e-4351-98fc-c5ade09b72df",
        status: "finished",
        scheduleTaskId: "6640e0ac788e5c742a1eea3f",
        task_id: "80eae6d4-4d90-41b6-b127-ba510546d41f",
        image_url: "https://img.midjourneyapi.xyz/mj/80eae6d4-4d90-41b6-b127-ba510546d41f.png",
        upscaleTaskId: "142fda58-c3c4-4b99-846a-512ac3d011ba",
        upscaleImage_url: "https://img.midjourneyapi.xyz/mj/142fda58-c3c4-4b99-846a-512ac3d011ba.png"
      },
      {
        topic: "Motivation",
        quote: "Don't aim for success if you want it; just do what you love and believe in, and it will come naturally.",
        prompt: "Generate an inspiring image featuring the quote: 'Don't aim for success if you want it; just do what you love and believe in, and it will come naturally.' Include motivational elements in the design.",
        topicId: "38ead003-70a7-490e-bc1c-b1f79a1fe9d3",
        imageId: "3fa6a4ae-9a71-445d-85c3-54ab5038abd3",
        status: "finished",
        scheduleTaskId: "6640e0ac788e5c742a1eea3f",
        task_id: "885827cf-940b-43e4-b9e6-895eb4bb2e32",
        image_url: "https://img.midjourneyapi.xyz/mj/885827cf-940b-43e4-b9e6-895eb4bb2e32.png",
        upscaleTaskId: "aeecb81d-9853-4451-9f12-143f5fbff412",
        upscaleImage_url: "https://img.midjourneyapi.xyz/mj/aeecb81d-9853-4451-9f12-143f5fbff412.png"
      }
    ]
  };
  
async function test (topicId, document){
  const res = await getAllMidjourneyData(topicId, document)
  console.log('res', res)
}

// test(topicId, document)

  module.exports = { getAllMidjourneyData };


  