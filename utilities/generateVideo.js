const videoshow = require("videoshow");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const fs = require("fs");
const { exec } = require("child_process");
const { uploadVideoToCloudinary, uploadVideoLinkToMongoDB } = require("./upload");

async function generateVideo(topicId) {
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

  console.log("inside test function", videoFileName);

  let cloudinaryLink;

  try {
    const generatedFiles = await getAllMidjourneyData(topicId);

    // creating video for each quote along with subtitle

    await createVideoWithGeneratedFiles(generatedFiles, topicId);

    console.log("All videos created and merged successfully.");

    await concatenateVideos(topicId);

    console.log("Concatenation done for video");

    // uploading the video in cloudinary

    cloudinaryLink = await uploadVideoToCloudinary(videoFilePath);

    console.log("cludl link", cloudinaryLink);

    // Saving uploaded video link to the database.
    await uploadVideoLinkToMongoDB(cloudinaryLink, topicId);

    console.log("video file link upload complete.");

    return cloudinaryLink;
  } catch (error) {
    console.error("Error in the generate function:", error);
    throw error;
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

  try {
    for (let i = 0; i < generatedFiles.length; i++) {
      const dataset = generatedFiles[i];
      const images = [
        {
          path: path.join(folderPath, dataset.image),
          loop: calculateLoopDuration(dataset.duration),
        },
      ];
      // console.log('Updated image', images);
      const outputFileName = `video_${topicId}_${i + 1}.mp4`;

      const subtitles = path.join(folderPath, dataset.captions);

      const inputAudioPath = path.join(folderPath, dataset.audio);

      const outputVideoPath = `final_${topicId}_${i + 1}.mp4`;

      await createVideoShoe(
        images,
        folderPath,
        outputFileName,
        inputAudioPath,
        outputVideoPath,
        audio
      );
    }
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
    videoshow(images, { transition: true })
      .audio(audio)
      .save(path.join(folderPath, outputFileName))
      .on("start", (command) =>
        console.log(`Video process started for ${outputFileName}`)
      )
      .on("error", (err) =>
        reject(new Error(`Error processing ${outputFileName}: ${err}`))
      )
      .on("end", async () => {
        console.log(`Video created for ${outputFileName} in:`, outputVideoPath);
        try {
          await mergeAudioWithVideo(
            path.join(folderPath, outputFileName),
            inputAudioPath,
            outputVideoPath
          );
          resolve();
        } catch (error) {
          reject(
            new Error(
              `Error merging audio and video for ${fileName}: ${error.message}`
            )
          );
        }
      });
  });
}

async function mergeAudioWithVideo(
  inputVideoPath,
  inputAudioPath,
  outputVideoPath
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
        .on("end", () => resolve(outputVideoPath));
    });
  } catch (error) {
    console.error("Error in mergeAudioWithVideo:", error);
    throw new Error(`Error merging videos ${error}`);
  }
}

async function concatenateVideos(topicId) {
  return new Promise((resolve, reject) => {
   try {
    const fileIndices = [1, 2, 3, 4, 5];
    // Generate input video filenames dynamically based on topicId and indices
    const inputs = fileIndices.map((index) =>
      path.join(
        __dirname,
        "..",
        "tempFolder",
        `final_${topicId}_${index}.mp4`
      )
    );
    // console.log('inputs', inputs);

    // Output video file
    const outputFilePath = path.join(
      __dirname,
      "..",
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
        reject(new Error(`Error in  video concatenation for topic id: ${topicId}: ${err}`))
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
    console.error(`Error in video concatenation for topic id: ${topicId}: ${err}`);
    throw new Error(`Error in video concatenation for topic id: ${topicId}: ${error.message}`);
   }
  });
}

module.exports = { generateVideo };
