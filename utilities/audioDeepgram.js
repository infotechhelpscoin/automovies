const fs = require('fs');
const path = require('path');
// const { createClient, srt } = require('@deepgram/sdk');
require("dotenv").config();
const ffmpeg = require('fluent-ffmpeg');
const https = require("https");
 
// const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// todo only for audio not caption

const topicId = 'ab12a'
const text = 'Hello my name is Enayet. I am a full stack web developer. I am building authshorts app clone.'


async function generateVoice(text, topicId) {

  
  const folderPath = path.join(__dirname, "..", "tempFolder"); 
     
      
  const audioFileName = `output_${topicId}.mp3`; 
  
  const audioFilePath = path.join(folderPath, audioFileName);

  try {



const url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";

// Set your Deepgram API key
const apiKey = "4401baf54c25799de155ae6362cdac7c730906a9";

// Define the payload
const data = JSON.stringify({
  text
});

// Define the options for the HTTP request
const options = {
  method: "POST",
  headers: {
    Authorization: `Token ${apiKey}`,
    "Content-Type": "application/json",
  },
};




// Make the POST request
const req = https.request(url, options, (res) => {
  // Check if the response is successful
  if (res.statusCode !== 200) {
    console.error(`HTTP error! Status: ${res.statusCode}`);
    return;
  }
  // Save the response content to a file
  const dest = fs.createWriteStream(audioFilePath);
  res.pipe(dest);
  dest.on("finish", () => {
    console.log("File saved successfully.");
  });
});

// Handle potential errors
req.on("error", (error) => {
  console.error("Error:", error);
});

// Send the request with the payload
req.write(data);
req.end();
console.log("File saved successfully 2.")

     

      // return { audio: audioFileName};

  } catch (err) {
    console.error('Error during voice generation:', err);
    throw new Error(`Failed to generate voice for topicId ${topicId}: ${err.message}`);
  }
}


// todo for test purpose

async function callDuration(text, topicId){
  const res = await generateVoice(text, topicId)
}

// const audioFile = `output_9f91add3-016c-4a7f-a29f-c2850c3268ec_0.mp3`
// const audioDir = path.join(__dirname, "..", "tempFolder");
//         const audioPath = path.join(audioDir, audioFile);


callDuration(text, topicId)