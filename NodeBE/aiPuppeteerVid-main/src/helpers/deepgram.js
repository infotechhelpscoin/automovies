const https = require("https");
const fs = require("fs");
const path = require('path');
const { Deepgram } = require('@deepgram/sdk');
const { webvtt,srt } = require('@deepgram/captions');

const deepgram = new Deepgram('a7056d8828505c8de14a6210f133bcdb1efc21f2');

async function saveSpeech(text, audioFilePath, srtPath) {
  try {
    const url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";
    const apiKey = "a7056d8828505c8de14a6210f133bcdb1efc21f2";

    const data = JSON.stringify({ text: text });

    const options = {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
    };

    await new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        if (res.statusCode !== 200) {
          console.error(`HTTP error! Status: ${res.statusCode}`);
          reject(new Error(`HTTP error! Status: ${res.statusCode}`));
          return;
        }

        const dest = fs.createWriteStream(audioFilePath);
        res.pipe(dest);
        dest.on("finish", () => {
          console.log("File saved successfully.");
          resolve();
        });
      });

      req.on("error", (error) => {
        console.error("Error:", error);
        reject(error);
      });

      req.write(data);
      req.end();
    });

    const response = await deepgram.transcription.preRecorded({
      buffer: fs.readFileSync(audioFilePath),
      mimetype: 'audio/mp3',
    }, {
      punctuate: true,
      utterances:true,
      model: 'nova',
      language: 'en-US',
    });

    const captionsFileName = path.basename(srtPath);
    const folderPath = path.dirname(srtPath);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const captionsFilePath = path.join(folderPath, captionsFileName);
    
// Check if the file exists and delete it
if (fs.existsSync(captionsFilePath)) {
  fs.unlinkSync(captionsFilePath);
}
    const stream = fs.createWriteStream(captionsFilePath, { flags: "a" });
    const captions = response.results.channels[0].alternatives[0].transcript;
    //response.toSRT()
    let x= srt(response,2);
    console.log('captionsFileName:', captionsFileName);
    stream.write(x);
    stream.end();

    return { audio: audioFilePath, captions: captionsFilePath };
  } catch (err) {
    console.error(err);
    return { audio: null, captions: null };
  }
}


module.exports = {
  saveSpeech: saveSpeech
};