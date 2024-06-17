const { status } = require("express/lib/response");
const { dbsearch, dbupdate } = require("../src/helpers/mongohelper");
const { startRecording, URLScreenshot, stopRecording } = require("../src/helpers/puppeteer");
const { getImageInfo } = require("../src/helpers/openai");
const { saveSpeech } = require("./deepgram");
const prompt = {
    SummarisePage: "Summarize the content of the webpage shown in the image."
};


function runMain(){
    let requests= dbsearch('RecordingVids',{status:'NotPicked'});
    for (let i = 0; i < requests.length; i++) {
        const r = requests[i];
        startRecording(r.id);
        for (let j = 0; j < r.URLs.length; j++) {
            const url = r.URLs[j];
            const screenShot= URLScreenshot(r.URL,`${j}.jpg`);
            const text =getImageInfo({path:screenShot,prompt:prompt.SummarisePage})
            saveSpeech(text,`./${r.id}/${j}.mp3`,`./${r.id}/${j}.aas`);
        }
        stopRecording(r.id);
        const fileurl= mergeAndUpload(r.id);
        dbupdate('RecordingVids',{id: r.id},{vidURL:fileurl,status:'Completed'});
    }
}
runMain()


//deepgram.js
const https = require("https");
const fs = require("fs");
const path = require('path');
const { createClient, srt } = require('@deepgram/sdk');
const deepgram = createClient('a7056d8828505c8de14a6210f133bcdb1efc21f2');

async function saveSpeech(text, path,srtPath) {
    try{
    
    const url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";
    
    // Set your Deepgram API key
    const apiKey = "a7056d8828505c8de14a6210f133bcdb1efc21f2";
    
    // Define the payload
    const data = JSON.stringify({
      text:text,
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
      const dest = fs.createWriteStream(path);
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
    
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            fs.readFileSync(audioFilePath),
            {
                model: "nova-2",
                smart_format: true,
                utterances: true
            },
        );

        if (error) throw error;

        const captionsFileName = `${srtPath}`; // Unique captions filename with timestamp
        const captionsFilePath = path.join(folderPath, captionsFileName);
        const stream = fs.createWriteStream(captionsFilePath, { flags: "a" });
        const captions = srt(result, 1); // SRT of 1 word in the file
        console.log('captionsFileName:', captionsFileName);
        stream.write(captions);
        stream.end();
        
        // Return the filenames
        return { audio: audioFileName, captions: captionsFileName };

    } catch (err) {
        console.error(err);
        return { audio: null, captions: null }; // Return null if there's an error
    }
}

module.exports = {
    generateVoice: generateVoice
};


//mongohelper.js
const MongoHelper = require('./mongo.js');

const mongoURL = 'mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/';
const dbName = 'tradingdb';


async function dbinsert(collection,values){
    const mongoHelper = new MongoHelper(mongoURL, dbName);
    await mongoHelper.connect();
    const insertResult = await mongoHelper.insertIntoCollection(collection, values);
  console.log('Inserted document:', insertResult.ops[0]);
  await mongoHelper.disconnect();
return 'Inserted document:'+ insertResult.ops[0];
}
async function dbsearch(collection,filters){
        const mongoHelper = new MongoHelper(mongoURL, dbName);
        await mongoHelper.connect();
        const searchResult = await mongoHelper.searchCollection(collection, filters);
        console.log('Search result:', searchResult);
      await mongoHelper.disconnect();
    return 'Search result:'+ searchResult;
}
async function dbupdate(collection,filter,values){
    const mongoHelper = new MongoHelper(mongoURL, dbName);
    await mongoHelper.connect();
 const updateResult = await mongoHelper.updateCollection(collection, filter, { $set: values });
  console.log('Updated document:', updateResult.modifiedCount);
  await mongoHelper.disconnect();
    return 'Updated document:'+ updateResult.modifiedCount;
}
async function dbgetItem(collectionName, itemId)
{
    const mongoHelper = new MongoHelper(mongoURL, dbName);
    await mongoHelper.connect();
    const collection = await this.getCollection(collectionName);
    await mongoHelper.disconnect();
    return await collection.findOne({ _id: new ObjectId(itemId) });
}
module.exports={
    dbgetItem,dbinsert,dbsearch,dbupdate
}



//mongo.js
const MongoClient = require('mongodb').MongoClient;

class MongoHelper {
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
  }

  async connect() {
    this.client = await MongoClient.connect(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.db = this.client.db(this.dbName);
  }

  async disconnect() {
    await this.client.close();
  }

  async getCollection(collectionName) {
    return this.db.collection(collectionName);
  }

  async getCollectionsList() {
    return await this.db.listCollections().toArray();
  }

  async searchCollection(collectionName, query) {
    const collection = await this.getCollection(collectionName);
    return await collection.find(query).toArray();
  }

  async insertIntoCollection(collectionName, document) {
    const collection = await this.getCollection(collectionName);
    return await collection.insertOne(document);
  }

  async updateCollection(collectionName, filter, update) {
    const collection = await this.getCollection(collectionName);
    return await collection.updateOne(filter, update);
  }
}

module.exports = MongoHelper;



//openai.js
const fs = require("fs");
const axios = require("axios");

const API_KEY = "sk-proj-RlgfaakTAOkGHEgXNrdhT3BlbkFJE2sPL59MmdLZqmnqRlbq";


async function getImageInfo(image) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };

  let responses = [];

  const payload = {
    model: "gpt-4o",
    max_tokens: 4000,
    messages: [],
  };

  
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

    if (image.path2) {
      const imageData2 = fs.readFileSync(image.path2);
      const base64Image2 = Buffer.from(imageData2).toString("base64");

      payload.messages[payload.messages.length - 1].content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image2}`,
        },
      });
    }
  

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      { headers }
    );

    const responseData = response.data.choices;
    console.log(responseData);
    return responseData;
  } catch (error) {
    console.error("Error during API call:", error.message);
  }

  return responses;
}

module.exports = { getImageInfo: getImageInfo };


//puppeteer.js
const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const Config = {
    followNewTab: true,
    fps: 60,
    videoFrame: {
      width: 1024,
      height: 768,
    },
    videoCrf: 18,
    videoCodec: 'libx264',
    videoPreset: 'ultrafast',
    videoBitrate: 1000,
    autopad: {
      color: 'black' | '#35A5FF',
    },
    aspectRatio: '4:3',
  };
  let page;
  let browser;
  let recorder;
async function startRecording(id)
{
  browser = await puppeteer.launch();
  page = await browser.newPage();
  recorder = new PuppeteerScreenRecorder(page,Config);
  await recorder.start(`${id}/${id}.mp4`);
}
async function URLScreenshot(URL,path){
    await page.goto(URL, { waitUntil: 'networkidle2' });
    const delay = time => new Promise(resolve => setTimeout(resolve, time)); // Create a delay function
    await page.screenshot({ path: path });
    return true;
}
async function stopRecording(URL,path){
    await recorder.stop(); // Stop the recording
    await browser.close(); // Close the browser
    return true;
}
  module.exports={startRecording:startRecording,
    URLScreenshot:URLScreenshot,
    stopRecording:stopRecording};