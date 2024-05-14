const videoshow = require("videoshow");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const fs = require("fs");
const fsp = require('fs').promises; 
const { exec } = require("child_process");
const { uploadVideoToCloudinary, uploadVideoLinkToMongoDB } = require("./upload");
const { getAllMidjourneyData } = require('./midjourney')

// const topicId = '098ffce8-5802-42ac-91a6-9c6a06b302f3'

async function generateVideo(topicId, document) {
  // TODO USE IT FOR TESTING PURPOSE
  // const generatedFiles = [
  //   {
  //     audio: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_0.mp3",
  //     captions: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_0.srt",
  //     image: "image_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.jpg",
  //     duration: 10.9975,
  //   },
  //   {
  //     audio: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.mp3",
  //     captions: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.srt",
  //     image: "image_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.jpg",
  //     duration: 2.925688,
  //   },
  //   {
  //     audio: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.mp3",
  //     captions: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.srt",
  //     image: "image_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.jpg",
  //     duration: 4.127313,
  //   },
  //   {
  //     audio: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.mp3",
  //     captions: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.srt",
  //     image: "image_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.jpg",
  //     duration: 7.183625,
  //   },
  //   {
  //     audio: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.mp3",
  //     captions: "output_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.srt",
  //     image: "image_098ffce8-5802-42ac-91a6-9c6a06b302f3_5.jpg",
  //     duration: 6.922438,
  //   },
  // ];

  const videoFileName = `${topicId}_finalVideo.mp4`;

  const videoFilePath = path.join(
    __dirname,
    "..",
    "/tempFolder",
    videoFileName
  );

  let cloudinaryLink;
  let videoPaths = []; 
  let generatedFiles;
  try {


    generatedFiles = await getAllMidjourneyData(topicId, document);

    // creating video for each quote along with subtitle

    const paths = await createVideoWithGeneratedFiles(generatedFiles, topicId);
    videoPaths = paths;

    await concatenateVideos(topicId);


    // uploading the video in cloudinary


    cloudinaryLink = await uploadVideoToCloudinary(videoFilePath);

console.log('cloudinary link', cloudinaryLink)
    // Saving uploaded video link to the database.
    await uploadVideoLinkToMongoDB(cloudinaryLink, document._id);


    return true;
  } catch (error) {
    console.error("Error in the generate function:", error);
    throw error;
  } finally {
  //   await cleanupFiles(videoPaths, generatedFiles)
  //   try {
  //     await fsp.unlink(videoFilePath);
  // } catch (error) {
  //     console.error(`Failed to delete final video file ${videoFilePath}:`, error);
  // }
  }
}

function calculateLoopDuration(audioDuration) {
  return Math.ceil(audioDuration);
}

async function createVideoWithGeneratedFiles(generatedFiles, topicId) {
  if (!generatedFiles || generatedFiles.length === 0) {
    throw new Error("No generated files provided or empty array.");
  }
  const folderPath = path.join(__dirname, "..", "tempFolder");
  const audio = path.join(__dirname, "..", "tempFolder", "song.mp3");
  const videoPaths = [];

  try {
    for (let i = 0; i < generatedFiles.length; i++) {
      const dataset = generatedFiles[i];
      const images = [
        {
          path: path.join(folderPath, dataset.image),
          loop: calculateLoopDuration(dataset.duration),
        },
      ];
      const outputFileName = `video_${topicId}_${i + 1}.mp4`;
      // const subtitles = path.join(folderPath, dataset.captions);

      const inputAudioPath = path.join(folderPath, dataset.audio);
      const outputVideoPath = path.join(folderPath, `final_${topicId}_${i + 1}.mp4`);
     const paths =  await createVideoShoe(
        images,
        folderPath,
        outputFileName,
        inputAudioPath,
        outputVideoPath,
        audio
      );
      videoPaths.push(paths.intermediateVideoPath, paths.finalVideoPath);
    }
    return videoPaths;
  } catch (error) {
    console.error("Error creating videos:", error);
    throw new Error(
      `Error creating videos for topicId ${topicId}: ${error.message}`
    );
  }
}

async function createVideoShoe(
  images,
  folderPath,
  outputFileName,
  inputAudioPath,
  outputVideoPath,
  audio
) {
  return new Promise((resolve, reject) => {
    const intermediateVideoPath = path.join(folderPath, outputFileName);
    videoshow(images, { transition: true })
      .audio(audio)
      .save(intermediateVideoPath)
      .on("start", (command) =>
        console.log(`Video process started for inside video show`)
      )
      .on("error", (err) =>
        reject(new Error(`Error processing ${outputFileName}: ${err}`))
      )
      .on("end", async () => {
        console.log(`Video created for ${outputFileName} in:`, outputFileName);
        try {
          await mergeAudioWithVideo(
            path.join(folderPath, outputFileName),
            inputAudioPath,
            outputVideoPath
          );
          resolve({intermediateVideoPath,finalVideoPath: outputVideoPath});
        } catch (error) {
          reject({
            error: new Error(`Error merging audio and video for ${outputVideoPath}: ${error.message}`),
            path: intermediateVideoPath // Include intermediate path for cleanup
          });
        }
      });
  });
}

async function mergeAudioWithVideo(
  inputVideoPath,
  inputAudioPath,
  outputVideoPath,folderPath
) {
  try {
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputVideoPath)
        .input(inputAudioPath)
        .complexFilter("[0:a][1:a]amix=inputs=2:duration=longest")
        .videoCodec("copy")
        .save(outputVideoPath)
        .on("error", (err) =>
          reject(new Error(`Error in merging audio and video: ${err}`))
        )
        .on("end", () => resolve('finalVideo output', outputVideoPath));
    });
  } catch (error) {
    console.error("Error in mergeAudioWithVideo:", error);
    throw new Error(`Error merging videos ${error}`);
  }
}

async function concatenateVideos(topicId) {
  return new Promise((resolve, reject) => {
   try {
    //todo for 5 images use it
    // const fileIndices = [1, 2, 3, 4, 5];
    //todo for 2 images use it
    const fileIndices = [1, 2];
    // Generate input video filenames dynamically based on topicId and indices
    const inputs = fileIndices.map((index) =>
      path.join(
        __dirname,'..', 'tempFolder',
        `final_${topicId}_${index}.mp4`
      )
    );

    // Output video file
    const outputFilePath = path.join(
      __dirname,
      "..",
      
        "tempFolder",
      `${topicId}_finalVideo.mp4`
    );
    // Construct the ffmpeg command string dynamically
    const inputCmdPart = inputs.map((input) => `-i "${input}"`).join(" ");
    const filterComplex = `concat=n=${inputs.length}:v=1:a=1`;
    const command = `ffmpeg ${inputCmdPart} -filter_complex "${filterComplex}" -f mp4 -y "${outputFilePath}"`;

    // Execute the command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error in video concat: ${error.message}`);
        reject(new Error(`Error in  video concatenation for topic id: ${topicId}: ${error}`))
              }
      // if (stderr) {
      //     // console.error(`ffmpeg stderr: ${stderr}`);
      //     reject(new Error(stderr));  // Treat stderr as an error
      //     return;
      // }
      console.log(`Video concatenated successfully. topicId: ${topicId}`);
      resolve(outputFilePath); // Resolve the promise with the output path
    });
   } catch (error) {
    console.error(`Error in video concatenation for topic id: ${topicId}: ${error}`);
    throw new Error(`Error in video concatenation for topic id: ${topicId}: ${error.message}`);
   }
  });
}

async function cleanupFiles(videoPaths, generatedFiles) {
  generatedFiles.forEach(file => {
    videoPaths.push(path.join(__dirname, "..", "tempFolder", file.audio));
    videoPaths.push(path.join(__dirname, "..", "tempFolder", file.image));
  });
  // Perform deletion of all files
  for (const filePath of videoPaths) {
    try {
      await fsp.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
}


// todo for test purpose
// const topicId = '4201b039-2e2d-4e99-85b4-b4f5e832f684'

// const generatedFiles =  [
//   {
//     audio: 'output_4201b039-2e2d-4e99-85b4-b4f5e832f684_0.mp3',
//     image: 'image_4201b039-2e2d-4e99-85b4-b4f5e832f684_1.jpg',
//     duration: 10.292188
//   },
//   {
//     audio: 'output_4201b039-2e2d-4e99-85b4-b4f5e832f684_1.mp3',
//     image: 'image_4201b039-2e2d-4e99-85b4-b4f5e832f684_2.jpg',
//     duration: 7.183625
//   },
//   {
//     audio: 'output_4201b039-2e2d-4e99-85b4-b4f5e832f684_2.mp3',
//     image: 'image_4201b039-2e2d-4e99-85b4-b4f5e832f684_3.jpg',
//     duration: 4.179563
//   },
//   {
//     audio: 'output_4201b039-2e2d-4e99-85b4-b4f5e832f684_3.mp3',
//     image: 'image_4201b039-2e2d-4e99-85b4-b4f5e832f684_4.jpg',
//     duration: 5.746938
//   },
//   {
//     audio: 'output_4201b039-2e2d-4e99-85b4-b4f5e832f684_4.mp3',
//     image: 'image_4201b039-2e2d-4e99-85b4-b4f5e832f684_5.jpg',
//     duration: 3.422
//   }
// ]

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

async function testCreateVideo(topicId, document){
  const res = await generateVideo(topicId, document)
  // const res2 = await concatenateVideos(topicId)
}



// testCreateVideo(topicId, document)
// generateVideo(topicId)
module.exports = { generateVideo };
