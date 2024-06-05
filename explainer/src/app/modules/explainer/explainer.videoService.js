import Explainer from "./explainer.model.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fsp from 'fs/promises';
import { createClient } from '@deepgram/sdk';
import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { exec } from 'child_process';
import videoshow from 'videoshow';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
});


ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function for fetching documents from db for video generation
const fetchPendingVideoRequests = async() => {
  try {
    const request = await Explainer.findOne({ status: 'imageProcessed' });
    console.log('Fetched imageProcessed data for processing from server');
    return request;
  } catch (error) {
    throw new Error(`Error in fetching documents from DB for vidoe  generation: ${error}`);
  }
}

const processVideoGeneration = async(document) => {
  const downloadDir = path.join(__dirname, 'downloads');
  let downloadedPaths = [];
  let finalVideoPath = '';
  let videoPaths = [];

  try {
    // console.log('documetn inside processVideoGeneration function', document)
    downloadedPaths = await downloadImages(document);

    console.log('Downloaded paths:', downloadedPaths);
    
    videoPaths = await createVideoWithGeneratedFiles(downloadedPaths, document._id);
    
    console.log('Individual video paths:', videoPaths);

    finalVideoPath = await concatenateVideos(videoPaths);

    console.log('Final concatenated video path:', finalVideoPath);

    // Upload final video to Cloudinary
    const cloudinaryUrl = await uploadVideoToCloudinary(finalVideoPath);

    console.log('Cloudinary URL:', cloudinaryUrl);


    // Save Cloudinary URL to the database
    const objectId = new mongoose.Types.ObjectId(document._id);

    await Explainer.findByIdAndUpdate(objectId, { $set: { videoUrl: cloudinaryUrl, status: 'videoProcessed' } },
    { new: true } );

    return cloudinaryUrl;
  } catch (error) {
    console.error('Error during video generation process:', error);
    throw new Error(`Failed to process video generation for document ${document._id}: ${error.message}`);
  } finally{
    // Clean up files
  try {
      const allFiles = [
        ...downloadedPaths.map(item => item.imagePath),
        ...downloadedPaths.map(item => item.audioPath),
        finalVideoPath,
        ...videoPaths
      ];
      await cleanUpFiles(allFiles);
      console.log('Cleaned up files successfully');
    } catch (cleanupError) {
      console.error('Error during file cleanup:', cleanupError);
    }
  }

}

const downloadImages = async (document) => {
  const downloadedPaths = [];
  const downloadDir = path.join(__dirname, 'downloads');

  await ensureDirectoryExists(downloadDir);

  for (const result of document.results) {
    const { chosenImagePath, summary } = result;
    const imageName = path.basename(chosenImagePath);
    const localImagePath = path.join(__dirname, 'downloads', imageName);

    try {
      const response = await axios({
        url: chosenImagePath,
        method: 'GET',
        responseType: 'stream',
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(localImagePath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

// Generate voice from the summary text using the same image name for the audio file
const { audioFilePath, duration } = await generateVoice(summary, imageName, downloadDir);

downloadedPaths.push({ imagePath: localImagePath, summary, audioPath: audioFilePath, duration });
console.log(`Downloaded and saved to: ${localImagePath}`);
    } catch (error) {
      console.error(`Error downloading image ${chosenImagePath}:`, error);
    }
  }

  return downloadedPaths;
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fsp.mkdir(dirPath, { recursive: true });
    console.log(`Directory ${dirPath} is ready`);
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
  }
};


// Function to generate voice from text and return audio file path and duration
 async function generateVoice(text, imageName, downloadDir) {
  const audioFileName = path.basename(imageName, path.extname(imageName)) + '.mp3';
  const audioFilePath = path.join(downloadDir, audioFileName);
  console.log('audio file path', audioFilePath);

  try {
    const url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";
    const apiKey = process.env.DEEPGRAM_API_KEY;

    // Axios request configuration
    const options = {
      method: 'POST',
      url: url,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream', 
      data: { text }
    };

    // Make the HTTP request using Axios
    const response = await axios(options);

    // Pipe the response data directly into a write stream for the file
    const writer = fs.createWriteStream(audioFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log("MP3 file has been saved.");
        resolve();
      });
      writer.on('error', reject);
    });

    // Get audio duration
    const duration = await getAudioDuration(audioFilePath);
    console.log('duration', duration)
    // Return the audio file path and duration
    return { audioFilePath, duration };
  } catch (err) {
    console.error('Error during voice generation:', err);
    throw new Error(`Failed to generate voice: ${err.message}`);
  }
}

// Function to get the audio duration
async function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File does not exist: ${filePath}`));
      return;
    }

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Error getting audio duration for ${filePath}: ${err.message}`));
      } else {
        const duration = metadata.format.duration;
        resolve(duration);
      }
    });
  });
}

function calculateLoopDuration(audioDuration) {
  return Math.ceil(audioDuration);
}

async function createVideoWithGeneratedFiles(generatedFiles, topicId) {
  if (!generatedFiles || generatedFiles.length === 0) {
    throw new Error("No generated files provided or empty array.");
  }
   const folderPath = path.join(__dirname, 'downloads');
  const videoPaths = [];

  console.log('videoPaths inside create video with generated files', createVideoWithGeneratedFiles)

  try {
    for (let i = 0; i < generatedFiles.length; i++) {
      const dataset = generatedFiles[i];
      const images = [
        {
          path: dataset.imagePath,
          loop: calculateLoopDuration(dataset.duration),
        },
      ];
      const outputFileName = `video_${topicId}_${i + 1}.mp4`;
      const inputAudioPath = dataset.audioPath;
      const outputVideoPath = path.join(folderPath, `final_${topicId}_${i + 1}.mp4`);

      const paths = await createVideoShow(
        images,
        folderPath,
        outputFileName,
        inputAudioPath,
        outputVideoPath
      );
      videoPaths.push(paths.finalVideoPath);
    }
    return videoPaths;
  } catch (error) {
    console.error("Error creating videos:", error);
    throw new Error(
      `Error creating videos for topicId ${topicId}: ${error.message}`
    );
  }
}

async function createVideoShow(
  images,
  folderPath,
  outputFileName,
  inputAudioPath,
  outputVideoPath
) {
  return new Promise((resolve, reject) => {
    const intermediateVideoPath = path.join(folderPath, outputFileName);
    videoshow(images, { transition: true })
      .audio(inputAudioPath)
      .save(intermediateVideoPath)
      .on("start", (command) =>
        console.log(`Video process started for inside video show`)
      )
      .on("error", (err) =>
        reject(new Error(`Error processing ${intermediateVideoPath}: ${err}`))
      )
      .on("end", () => {
        console.log(`Video created for ${intermediateVideoPath} in:`, intermediateVideoPath);
        resolve({ intermediateVideoPath, finalVideoPath: intermediateVideoPath });
      });
  });
}

async function concatenateVideos(videoPaths) {
  return new Promise((resolve, reject) => {
    try {
      const folderPath = path.join(__dirname, 'downloads');
      const inputs = videoPaths;
      const outputFilePath = path.join(folderPath, 'final_concatenated_video.mp4');
      const inputCmdPart = inputs.map((input) => `-i "${input}"`).join(" ");
      const filterComplex = `concat=n=${inputs.length}:v=1:a=1`;
      const command = `ffmpeg ${inputCmdPart} -filter_complex "${filterComplex}" -f mp4 -y "${outputFilePath}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error in video concat: ${error.message}`);
          reject(new Error(`Error in video concatenation: ${error}`));
        }
        console.log(`Video concatenated successfully.`);
        resolve(outputFilePath);
      });
    } catch (error) {
      console.error(`Error in video concatenation: ${error}`);
      throw new Error(`Error in video concatenation: ${error.message}`);
    }
  });
}

// Function to upload video to Cloudinary
const uploadVideoToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload video to Cloudinary');
  }
};

// Function to clean up files
const cleanUpFiles = async (paths) => {
  for (const filePath of paths) {
    try {
      await fsp.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${filePath}`, error);
    }
  }
};



export default {
  fetchPendingVideoRequests, processVideoGeneration, uploadVideoToCloudinary
}