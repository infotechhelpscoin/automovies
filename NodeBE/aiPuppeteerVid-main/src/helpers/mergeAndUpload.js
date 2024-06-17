// mergeandupload.js
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

async function mergeAndUpload(id) {
  const folderPath = `./${id}`;
  const videoFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.mp4'));
  const audioFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.mp3'));
  const srtFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.srt'));

  const mergedVideoPath = path.join(folderPath, `${id}_merged.mp4`);
  const mergedAudioPath = path.join(folderPath, `${id}_merged.mp3`);

  // Merge video files
  let mergeVideo = ffmpeg();
  videoFiles.forEach(file => {
    mergeVideo = mergeVideo.input(path.join(folderPath, file));
  });
  await new Promise((resolve, reject) => {
    mergeVideo.mergeToFile(mergedVideoPath)
      .on('end', resolve)
      .on('error', reject);
  });

  // Merge audio files
  let mergeAudio = ffmpeg();
  audioFiles.forEach(file => {
    mergeAudio = mergeAudio.input(path.join(folderPath, file));
  });
  await new Promise((resolve, reject) => {
    mergeAudio.mergeToFile(mergedAudioPath)
      .on('end', resolve)
      .on('error', reject);
  });

  // Merge subtitles into the video
  await new Promise((resolve, reject) => {
    ffmpeg(mergedVideoPath)
      .input(mergedAudioPath)
      .outputOptions('-c:v copy')
      .outputOptions('-c:a aac')
      .outputOptions('-map 0:v')
      .outputOptions('-map 1:a')
      .outputOptions('-shortest')
      .output(path.join(folderPath, `${id}_final.mp4`))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Upload the final video (you need to implement the upload logic based on your requirements)
  const finalVideoPath = path.join(folderPath, `${id}_final.mp4`);
  // Upload the final video and return the URL or any relevant information
  // ...

  return 'File URL or any relevant information';
}

module.exports = {
  mergeAndUpload: mergeAndUpload
};