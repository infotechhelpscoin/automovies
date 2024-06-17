const {
    startRecording,
    URLScreenshot,
    stopRecording,
    stopBrowser,
    URLScrollScreenshot,
    runContent,
} = require("./helpers/puppeteer");
const { startBrowser } = require("./helpers/puppeteer");

async function createVidFromURL(url, audioLength, savepath) {
    const { browser, recorder, page } = await startBrowser();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await recorder.start(savepath);

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    const totalScrolls = Math.ceil(scrollHeight / viewportHeight);
    const scrollDelay = Math.floor(audioLength / totalScrolls) * 1000; // delay in milliseconds

    let count = 0;

    async function delay(time) {
        return new Promise(function(resolve) { 
            setTimeout(resolve, time);
        });
    }

    // Initial delay before the first scroll
    await delay(2000); // Wait for 2 seconds before the first scroll

    while (count < totalScrolls) {
        const scrollStep = viewportHeight / 10; // Scroll smaller increments
        const steps = 10;
        
        for (let i = 0; i < steps; i++) {
            await page.evaluate((scrollStep) => window.scrollBy(0, scrollStep), scrollStep);
            await delay(scrollDelay / steps); // Delay for each small increment
        }
        
        count++;
    }

    await recorder.stop();
    await browser.close();
}


(async () => {
    // const args = process.argv.slice(2);
    // const url = args[0];
    // const audioLength = parseInt(args[1], 10);
    // const savepath = args[2];
   let url = "https://github.com/CopilotKit/CopilotKit?utm_source=manuagi.beehiiv.com&utm_medium=referral&utm_campaign=top-trending-open-source-github-projects-this-week-decentralized-ai-agents-to-coding-assistants";
    let audio_length = 20 ;
    let savepath = "output.mp4";

    try {
        await createVidFromURL(url, audio_length, savepath);
        console.log('Recording completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during recording:', error);
        process.exit(1);
    }
})();
