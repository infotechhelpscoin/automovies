const fs = require('fs');
const path = require('path');
// const { createClient, srt } = require('@deepgram/sdk');
require("dotenv").config();
const ffmpeg = require('fluent-ffmpeg');
const { default: axios } = require('axios');
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
 
// const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// todo only for audio not caption

async function generateVoice(text, topicId, index) {
  const fetch = (await import('node-fetch')).default;
  const options = {
      method: 'POST',
      headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENGRAM_API_KEY
      },
      body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
              stability: 1,
              similarity_boost: 1,
              style: 1,
              use_speaker_boost: true
          }
      })
  };

  const folderPath = path.join(__dirname, "..", "tempFolder"); 
  
  const audioFileName = `output_${topicId}_${index}.mp3`; 
  
  const audioFilePath = path.join(folderPath, audioFileName);
  try {
    const url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";
    const apiKey = process.env.DEEPGRAM_API_KEY; // Ensure your API key is stored in environment variables

    // Axios request configuration
    const options = {
      method: 'POST',
      url: url,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream',  // Important for handling binary data like audio files
      data: {
        text
      }
    };

    // Make the HTTP request using Axios
    const response = await axios(options);

    // Pipe the response data directly into a write stream for the file
    const writer = fs.createWriteStream(audioFilePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log("MP3 file has been saved.");
        resolve({ audio: audioFileName });
      });
      writer.on('error', reject);
    });

  } catch (err) {
    console.error('Error during voice generation:', err);
    throw new Error(`Failed to generate voice for topicId ${topicId}: ${err.message}`);
  }
}

// todo for audio and caption 
// async function generateVoice(text, topicId, index) {
//   const fetch = (await import('node-fetch')).default;
//   const options = {
//       method: 'POST',
//       headers: {
//           'Accept': 'audio/mpeg',
//           'Content-Type': 'application/json',
//           'xi-api-key': process.env.ELEVENGRAM_API_KEY
//       },
//       body: JSON.stringify({
//           text: text,
//           model_id: "eleven_multilingual_v2",
//           voice_settings: {
//               stability: 1,
//               similarity_boost: 1,
//               style: 1,
//               use_speaker_boost: true
//           }
//       })
//   };

//   try {

//       const folderPath = path.join(__dirname, "..", "tempFolder"); 
     
      
//       const audioFileName = `output_${topicId}_${index}.mp3`; 
      
//       const audioFilePath = path.join(folderPath, audioFileName);

//       const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/29vD33N1CtxCmqQRPOHJ', options);

//       // console.log('response from eleven labs', response)
//       const buffer = await response.arrayBuffer();
//       const data = Buffer.from(buffer);
     
//       fs.writeFileSync(audioFilePath, data);

//       // console.log('MP3 file has been saved.');

//       const audioData = fs.readFileSync(audioFilePath);
      
//       // console.log('Transcribing audio using Deepgram...');

//       const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
//           fs.readFileSync(audioFilePath),
//           {
//               model: "nova-2",
//               smart_format: true,
//               utterances: true
//           },
//       );

//       if (error) throw new Error(`Deepgram transcription failed: ${error}`);

//       const captionsFileName = `output_${topicId}_${index}.srt`; 
      
//       const captionsFilePath = path.join(folderPath, captionsFileName);

//       const stream = fs.createWriteStream(captionsFilePath, { flags: "a" });

//       const captions = srt(result, 1); 
      
//       // console.log('captionsFileName:', captionsFileName);

//       stream.write(captions);
//       stream.end();
//       // console.log('Captions file has been saved:', captionsFilePath);

//       // Return the filenames
//       return { audio: audioFileName, captions: captionsFileName };

//   } catch (err) {
//     console.error('Error during voice generation:', err);
//     throw new Error(`Failed to generate voice for topicId ${topicId}: ${err.message}`);
//   }
// }




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

// todo for test purpose

async function callGenerateVoice() {
  const text = "This is the sample text for generating voice and captions. This is tested by Enayet for authshort project.";
  const topicId = 123;  // Replace with the actual topic ID
  const index = 1;      // Replace with the appropriate index

  try {
    const { audio, captions } = await generateVoice(text, topicId, index);
    console.log(`Generated audio file: ${audio}`);
    console.log(`Generated captions file: ${captions}`);
  } catch (error) {
    console.error('Error in generating voice and captions:', error);
  }
}

// Call the function
// callGenerateVoice();


async function callDuration(audioPath){
  const res = await getAudioDuration(audioPath)
  console.log(res)
}

// const audioFile = `output_9f91add3-016c-4a7f-a29f-c2850c3268ec_0.mp3`
// const audioDir = path.join(__dirname, "..", "tempFolder");
//         const audioPath = path.join(audioDir, audioFile);


// callDuration(audioPath)
module.exports={generateVoice, getAudioDuration}
