import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import Explainer from './explainer.model.js';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import ExplainerVideoService from './explainer.videoService.js';

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
});

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// FUNCTION TO SAVE VDIEO AND TRANSCRIPT TO DB
const createExplainerRequest = async (videoPath, transcriptionPath) => {
  const newRequest = new Explainer({
    videoPath,
    transcriptionPath,
    status: 'pending'
  });
  await newRequest.save();
  return newRequest;
};


// FETCHING PENDING TASK FROM DB
const fetchPendingExplainerRequests = async () => {
  try {
    const requests = await Explainer.find({ status: 'pending' });
    console.log('Fetched data for processing from server');
    return requests;
  } catch (error) {
    throw new Error(`Error in fetching documents from DB for summary and image generation: ${error}`);
  }
};

// Main function to process image and summary generation and store into db. 

const processVideoRequest = async (request) => {
  const { videoPath, transcriptionPath } = request;
  const results = []
  const outputDirs = [];
 
  try {

    const objectId = new mongoose.Types.ObjectId(request._id);
    await Explainer.findByIdAndUpdate(
      objectId,
      { $set: { status: 'imageProcessing' } },
      { new: true }
    );
    // generating duration of video
    const videoDuration = await getVideoDuration(videoPath);
    console.log('Video duration:', videoDuration);

    // Add further processing steps here
    const numChunks = Math.ceil(videoDuration / 120);

    console.log('numChunks', numChunks)

    // getting the content of transcription file
    const transcriptionContent = fs.readFileSync(transcriptionPath, 'utf-8');

    for (let i = 0; i < numChunks; i++) {
      console.log(`index number of ${i} chunk started for image processing`)
      const startTime = i * 120;

      const outputDir = path.join(__dirname, 'images', `${path.basename(videoPath, path.extname(videoPath))}-chunk${i}`);

      outputDirs.push(outputDir)

      fs.mkdirSync(outputDir, { recursive: true });

      await generateImagesFromChunk(videoPath, startTime, outputDir, i);

      const concatenatedImagePath = await concatImages(outputDir, i);

      const transcriptWithTimeStamp = await separateTranscriptIntoChunks(transcriptionContent, i)

      const transcript = await removeTimestamps(transcriptWithTimeStamp)
      // console.log('transcript........', transcript)

      const prompt = `The image contains five screenshots arranged vertically. Please provide two separate responses:
1. Specify the index of the chosen image from these five screenshots by returning a number between 1 and 5. The response style will be Chosen image index: [number]
2. Provide a summary of the given transcription, unrelated to the image. Here is the transcription: ${transcript}. The response style will be Transcript summary: [summary text]`;


      const gptResponse = await getImageInfo({ path: concatenatedImagePath, prompt: prompt, saveFilePath: transcriptionPath });

      // Extract the chosen image index and transcript summary from the GPT response
      const chosenImageIndexMatch = gptResponse.match(/Chosen image index: (\d)/);
      const summaryMatch = gptResponse.match(/Transcript summary: (.+)/);

      if (chosenImageIndexMatch && summaryMatch) {
        const chosenImageIndex = parseInt(chosenImageIndexMatch[1], 10);
        const summary = summaryMatch[1].trim();

        const chosenImagePath = path.join(outputDir, `image-${i}-${chosenImageIndex}.png`);
        results.push({ chosenImagePath, summary }); // Store the result in the array
      }
  
    }

    await uploadImagesToCloudinary(results);

  

    const newObjectId = new mongoose.Types.ObjectId(request._id);
    await Explainer.findByIdAndUpdate( 
      newObjectId,
      { $set: { results: results, status: 'imageProcessed' } },
      { new: true } 
    );

        const fullVideoPath = path.resolve(__dirname,'..','..','..','..', videoPath);

        console.log('full video path for delete', fullVideoPath)
    
        const fullTranscriptionPath = path.resolve(__dirname,'..','..','..','..', transcriptionPath);
     
        console.log('fullTranscriptionPath for delete', fullTranscriptionPath)
        // Delete the video and transcription files
        await deleteFile(fullVideoPath);
        await deleteFile(fullTranscriptionPath);
 
  } catch (error) {
  await Explainer.findByIdAndUpdate(
    request._id,
    { $set: { status: 'pending' } },
    { new: true }
  );
  throw new Error(`Error getting video duration for request with ID: ${request._id} - ${error.message}`);
  } finally {
    // Delete all local images after processing
    for (const outputDir of outputDirs) {
      await deleteLocalImages(outputDir);
    }
    
  
  }
};


// Video duration generation function
const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

// Image generation function from 2 min video
const generateImagesFromChunk = (videoPath, startTime, outputDir, chunkIndex) => {
  console.log('Processing video from starting time', startTime)
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .setStartTime(startTime)
      .duration(120) // 2 minutes in seconds
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        count: 5,
        folder: outputDir,
        size: '320x240',
        filename: `image-${chunkIndex}-%i.png`
      });
  });
};

// Function to concat images to make a single image
const concatImages = async (outputDir, chunkIndex) => {
  const images = fs.readdirSync(outputDir)
    .filter(file => file.startsWith('image-'))
    .map(file => path.join(outputDir, file));

  const concatenatedImagePath = path.join(outputDir, `concatenated-image-chunk${chunkIndex}.png`);

  const imageBuffers = await Promise.all(images.map(image => sharp(image).resize(320, 240).toBuffer()));

  await sharp({
    create: {
      width: 320,
      height: 240 * imageBuffers.length,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(imageBuffers.map((buffer, index) => ({ input: buffer, top: 240 * index, left: 0 })))
    .toFile(concatenatedImagePath);

  console.log(`Concatenated image path: ${concatenatedImagePath}`);

  return concatenatedImagePath;
};

// Function to get 2 min transcript
function separateTranscriptIntoChunks(transcript, chunkIndex) {
  const transcriptLines = transcript.split(/\n/);


  const startTime = chunkIndex * 120;
  const endTime = startTime + 120;

  let chunkText = "";
  let currentLineTime = 0;

  // Loop through transcript lines
  for (const line of transcriptLines) {
    const timestampMatch = line.match(/(\d+:\d+)/);

    // Check if a timestamp is found
    if (timestampMatch) {
      currentLineTime = (parseInt(timestampMatch[1]) || 0) + (timestampMatch[0].split(':')[0] * 60)
    }


    if (currentLineTime >= startTime && currentLineTime <= endTime) {
      chunkText += line + "\n";
    } else if (currentLineTime > endTime) {
      break;
    }
  }

  return chunkText.trim(); // Return the trimmed chunk text
}

// Function to remove timestamp from transcript
function removeTimestamps(transcript) {
  // Regular expression to match timestamps
  const timestampRegex = /(\d+:\d+)/g;

  // Replace timestamps with an empty string
  return transcript.replace(timestampRegex, "");
}

// Function to get image index and summary from gpt
async function getImageInfo(image) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.API_KEY}`,
  };

  let responses = [];

  const payload = {
    model: "gpt-4o",
    max_tokens: 4000,
    messages: [],
  };

  // console.log('image', image)

  const imageData = fs.readFileSync(image.path);
  const base64Image = Buffer.from(imageData).toString("base64");

  payload.messages.push({
    role: "user",
    content: [
      {
        type: "text",
        text: `${image.prompt}`,
      },
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
        },
      },
    ],
  });

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      { headers }
    );

    // const responseData = response.data.choices;
    const responseData = response.data.choices[0].message.content;
    // console.log(responseData[0].message.content);

    return responseData;

  } catch (error) {
    console.error("Error during API call:", error.message);
  }

  return responses;
}

// Function to upload images to cloudinary
const uploadImagesToCloudinary = async (results) => {
  try {
    for (const result of results) {
      const { chosenImagePath } = result;
      const uploadedResponse = await cloudinary.uploader.upload(chosenImagePath);
      // Update the chosenImagePath to the Cloudinary URL
      result.chosenImagePath = uploadedResponse.secure_url;
    }
    console.log('All images uploaded to Cloudinary:', results);
  } catch (error) {
    console.error('Error uploading images to Cloudinary:', error);
    throw new Error(`Error uploading images to Cloudinary: ${error}`)

  }
};

// Function to delete all files in a directory
const deleteLocalImages = async (outputDir) => {
  try {
    const files = await fsp.readdir(outputDir);
    for (const file of files) {
      await fsp.unlink(path.join(outputDir, file));
    }
    await fsp.rmdir(outputDir); // Remove the directory after deleting all files
    console.log(`Deleted all images in ${outputDir}`);
  } catch (error) {
    console.error(`Error deleting images in ${outputDir}:`, error);
  }
};

// Function to delete a file
const deleteFile = async (filePath) => {
  try {
    await fsp.unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file: ${filePath}`, error);
  }
};


export default {
  createExplainerRequest,
  fetchPendingExplainerRequests,
  processVideoRequest, 
};
