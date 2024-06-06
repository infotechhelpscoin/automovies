
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Use absolute paths for video and subtitle image
const videoPath = path.resolve('output/clip_1.mp4');
const subtitleImagePath = path.resolve('output/dialogue_1.png');
const outputVideoPath = path.resolve('output/clip_with_subtitle.mp4');

console.log('videoPath', videoPath);
console.log('subtitleImagePath', subtitleImagePath);

// Add image as subtitle to video at the bottom center
ffmpeg(videoPath)
  .outputOptions([
    `-vf`, `movie=${subtitleImagePath} [watermark]; [in][watermark] overlay=10:H-h-10 [out]`,
    '-c:v', 'libx264',
    '-c:a', 'copy'
  ])
  .on('end', () => {
    console.log('Subtitle added successfully');
  })
  .on('error', (err) => {
    console.error('Error adding subtitle:', err.message);
  })
  .save(outputVideoPath);