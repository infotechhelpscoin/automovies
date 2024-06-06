const express = require('express');
const multer = require('multer');
const videoshow = require('videoshow');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = 3000;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/create-video', upload.fields([{ name: 'images' }, { name: 'audio' }, { name: 'subtitleFile' }]), (req, res) => {
  if (!req.files['images'] || !req.files['audio'] || !req.files['subtitleFile']) {
    return res.status(400).send('All files (images, audio, subtitleFile) are required.');
  }

  const images = req.files['images'].map(file => file.path);
  const audio = req.files['audio'][0].path;
  const subtitleFile = req.files['subtitleFile'][0].path;
  const initialVideoPath = 'uploads/video_without_subtitles.mp4';
  const overlayImagePath = 'uploads/overlay_image.png';
  const videoWithOverlayPath = 'uploads/video_with_overlay.mp4';
  const finalVideoPath = 'uploads/video_with_subtitles.mp4';

  console.log('images', images);
  console.log('audio', audio);
  console.log('subtitleFile', subtitleFile);
  console.log('overlayImagePath', overlayImagePath);

  const videoOptions = {
    fps: 25,
    loop: 5, // seconds
    transition: true,
    transitionDuration: 1, // seconds
    videoBitrate: 1024,
    videoCodec: 'libx264',
    size: '640x?',
    audioBitrate: '128k',
    audioChannels: 2,
    format: 'mp4',
    pixelFormat: 'yuv420p'
  };

  videoshow(images, videoOptions)
    .audio(audio)
    .save(initialVideoPath)
    .on('start', function (command) {
      console.log('ffmpeg process started:', command);
    })
    .on('error', function (err, stdout, stderr) {
      console.error('Error:', err);
      console.error('ffmpeg stderr:', stderr);
      res.status(500).send('Error creating video');
    })
    .on('end', function (output) {
      console.log('Initial video created in:', output);

      // Generate overlay image from SSA/ASS file
      const generateOverlayCommand = `ffmpeg -i ${subtitleFile} -vf "ass=${subtitleFile},scale=640:-1" -frames:v 1 ${overlayImagePath}`;
      exec(generateOverlayCommand, (err, stdout, stderr) => {
        if (err) {
          console.error('Error generating overlay image:', err);
          console.error('ffmpeg stderr:', stderr);
          return res.status(500).send('Error generating overlay image');
        }
        console.log('Overlay image generated:', overlayImagePath);

        // Overlay the image on the video using ffmpeg
        const overlayCommand = `ffmpeg -i ${initialVideoPath} -i ${overlayImagePath} -filter_complex "overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" ${videoWithOverlayPath}`;
        exec(overlayCommand, (err, stdout, stderr) => {
          if (err) {
            console.error('Error overlaying image:', err);
            console.error('ffmpeg stderr:', stderr);
            return res.status(500).send('Error overlaying image on video');
          }
          console.log('Image overlay added, video created in:', videoWithOverlayPath);

          // Add subtitles to the video with overlay
          const subtitleCommand = `ffmpeg -i ${videoWithOverlayPath} -vf "ass=${subtitleFile}" ${finalVideoPath}`;
          exec(subtitleCommand, (err, stdout, stderr) => {
            if (err) {
              console.error('Error adding subtitles:', err);
              console.error('ffmpeg stderr:', stderr);
              return res.status(500).send('Error adding subtitles to video');
            }
            console.log('Subtitles added, video created in:', finalVideoPath);
            res.download(finalVideoPath, 'video_with_subtitles.mp4', function (err) {
              if (err) {
                console.error('Error downloading the video:', err);
              } else {
                // Cleanup the uploaded files and created videos after download
                // Uncomment the lines below to delete the files after download
                // fs.unlink(audio, err => { if (err) console.error(err); });
                // fs.unlink(subtitleFile, err => { if (err) console.error(err); });
                // images.forEach(image => fs.unlink(image, err => { if (err) console.error(err); }));
                // fs.unlink(initialVideoPath, err => { if (err) console.error(err); });
                // fs.unlink(overlayImagePath, err => { if (err) console.error(err); });
                // fs.unlink(videoWithOverlayPath, err => { if (err) console.error(err); });
                // fs.unlink(finalVideoPath, err => { if (err) console.error(err); });
              }
            });
          });
        });
      });
    });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
