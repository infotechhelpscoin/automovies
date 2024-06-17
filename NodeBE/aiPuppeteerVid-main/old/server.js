const puppeteer = require('puppeteer');
const db = require('./db.js');
//const TTS = require('./playht.js');
const uid = require('uid');

const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const axios = require('axios');
const gpt=require('./image.js')
const fs = require('fs');
const say = require('say');

const API_KEY = 'sk-proj-RlgfaakTAOkGHEgXNrdhT3BlbkFJE2sPL59MmdLZqmnqRlbq';  // Replace with your actual API key
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

async function recordWithTransition(images,textArray)
{

}



(async () => {
//const newUid = uid.sync(10);

  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  const recorder = new PuppeteerScreenRecorder(page,Config);
  
  await recorder.start('newUid' +'.mp4'); // Recording starts, file will be saved as simple.mp4
//   let st=new Date();
//   const delay = time => new Promise(resolve => setTimeout(resolve, time)); // Create a delay function
// // let images=[];
// // for (let i = 0; i < 5; i++) {
// // const img = images[i];
  
// // }



//   async function scrollDownIncrementally() {
//     let count = 0; // Initialize a counter for the number of scrolls
//     while (count < 3) { // Limit to 3 scrolls
//       await page.evaluate(() => window.scrollBy(0, 100)); // Scroll down by 100 units
//       await delay(2000); // Wait for 2 seconds after each scroll
//       await page.mouse.move(100, 200);
//       await page.mouse.move(200, 100);
  
//       count++; // Increment the counter
//   //    const screenshot = await page.screenshot({ encoding: 'base64' });
//     //console.log(screenshot);
    

// const screenshotPath = `screenshot${count}.jpg`;
// const audPath = `aud${count}.jpg`;
// // Capture the screenshot and save it as a .jpg file
// //await page.screenshot({ path: screenshotPath });
// let time=new Date()-st;

// // Read the saved .jpg file
// //const text = await gpt.getImageInfo(screenshotPath);
// //console.log(text);
// //TTS.TTS(text,audPath);
// //db.dbinsert({uid:newUid,image:screenshotPath,time:time,text:text,audPath:audPath });

//     }
//   }
  const images = ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg', 'image5.jpg']; // Array of image URLs
  const durations = [2000, 2000, 2000, 2000, 2000]; // Wait times before zooming in/out in milliseconds

  const baseUrl = 'file:///Users/balpreetsingh/Code/PuppeteerScreenRecorder/zoominout.html';
  const queryParams = images.map((img, index) => `image${index + 1}=${img}`).concat(
      durations.map((time, index) => `time${index + 1}=${time}`)
  );
  const urlWithParams = `${baseUrl}?${queryParams.join('&')}`;
console.log(urlWithParams);
  await page.goto(urlWithParams, { waitUntil: 'networkidle2' });
  const delay = time => new Promise(resolve => setTimeout(resolve, time)); // Create a delay function
  await delay(20000);
  // Visit the first website
 // await page.goto('file:///Users/balpreetsingh/Code/PuppeteerScreenRecorder/zoominout.html', { waitUntil: 'networkidle2' });
  //await scrollDownIncrementally(); // Perform limited scrolling

  await recorder.stop(); // Stop the recording
  await browser.close(); // Close the browser
})();

