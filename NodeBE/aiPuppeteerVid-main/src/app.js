const { status } = require("express/lib/response");
const { dbsearch, dbupdate } = require("./helpers/mongohelper");
const {
  startRecording,
  URLScreenshot,
  stopRecording,
  startBrowser,
  stopBrowser,
  URLScrollScreenshot,
  runContent,
} = require("./helpers/puppeteer");
const { saveImageInfo } = require("./helpers/openai");
const { mergeAndUpload } = require("./helpers/mergeAndUpload");
const { saveSpeech } = require("./helpers/deepgram");
const path = require('path');

const prompt = {
  SummarisePage: "Summarize the content of the webpage shown in the image.",
};

async function runMain() {
  let requests = await dbsearch('RecordingVids', { status: 'NotPicked' });
  console.log('Retrieved requests:', requests);

  for (let i = 0; i < requests.length; i++) {
    const r = requests[i];
    console.log('Processing request:', r);

    let { browser, page } = await startBrowser();
    console.log('Browser started for request:', r.id);

    let content = [];
    if (r.URLs && r.URLs.length > 0) {
      for (let j = 0; j < r.URLs.length; j++) {
        const url = r.URLs[j];
        console.log('Processing URL:', url);
        console.log(r.id);

        const screenshotsPath = await URLScrollScreenshot(page, url, `./${r.id}/${j}.jpg`);
        console.log('Screenshots captured for URL:', url);

        for (let k = 0; k < screenshotsPath.length; k++) {
          const s = screenshotsPath[k];
          const basename = path.basename(s, path.extname(s));
          console.log(`Basename without extension: ${basename}`);

          const text = await saveImageInfo({
            path: s,
            prompt: prompt.SummarisePage,
            saveFilePath: `./${r.id}/${basename}.txt`,
          });
          await saveSpeech(text, `./${r.id}/${basename}.mp3`, `./${r.id}/${basename}.srt`);

          content.push({
            srt: `${basename}.srt`,
            mp3: `${basename}.mp3`,
            screenshot: `${basename}.jpg`,
          });
        }
      }

      let recorder = await startRecording(page, r.id);
      await runContent(page, content);
      await stopRecording(recorder);
      await stopBrowser(browser);
    } else {
      console.log('No URLs found for request:', r.id);
    }

    console.log('Recording stopped for request:', r.id);

    const fileurl = await mergeAndUpload(r.id);
    console.log('Files merged and uploaded for request:', r.id);

    await dbupdate('RecordingVids', { id: r.id }, { vidURL: fileurl, status: 'Completed' });
    console.log('Database updated for request:', r.id);
  }

  console.log('All requests processed successfully!');
}

runMain();