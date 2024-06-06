const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const videoshow = require('videoshow');

// Function to parse the ASS file and extract dialogues
function parseAssFile(filePath) {
    const dialogues = [];
    const data = fs.readFileSync(filePath, 'utf-8');
    const lines = data.split('\n');

    for (let line of lines) {
        if (line.startsWith('Dialogue')) {
            const match = line.match(/Dialogue:\s*[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,(.*)/);
            if (match) {
                dialogues.push(match[1].trim());
            }
        }
    }

    return dialogues;
}

// Function to create an image for each line of text
async function createImage(text, outputPath, fontSize = 20, imgWidth = 800, imgHeight = 200, bgColor = 'rgba(0, 0, 0, 0)', textColor = '#FFFFFF', textBgColor = '#FFFFFF') {
    const canvas = createCanvas(imgWidth, imgHeight);
    const ctx = canvas.getContext('2d');

    // Set background color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, imgWidth, imgHeight);

    // Set text properties
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Split the text into words
    const words = text.split(' ');
    let xPosition = 50; // Starting position for text
    const y = imgHeight / 2;
    const padding = 5;

    for (const word of words) {
        const wordWidth = ctx.measureText(word).width;

        if (word === 'another' || word === 'text') {
            // Draw background for "another" and "text"
            ctx.fillStyle = textBgColor;
            ctx.fillRect(xPosition - padding, y - fontSize / 2 - padding, wordWidth + 2 * padding, fontSize + 2 * padding);

            // Draw the word with black text color
            ctx.fillStyle = '#000000';
            ctx.fillText(word, xPosition, y);
        } else {
            // Draw the word with white text color
            ctx.fillStyle = textColor;
            ctx.fillText(word, xPosition, y);
        }

        // Move to the next position
        xPosition += wordWidth + ctx.measureText(' ').width; // Add space width
    }

    // Save image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
}

// Main function to process the ASS file and generate images
async function processAssFile(filePath) {
    const dialogues = parseAssFile(filePath);
    for (let i = 0; i < dialogues.length; i++) {
        const text = dialogues[i];
        const outputPath = `output/dialogue_${i + 1}.png`;
        await createImage(text, outputPath);
        console.log(`Generated image for dialogue ${i + 1}`);
    }
}

// Ensure the output directory exists
if (!fs.existsSync('output')) {
    fs.mkdirSync('output');
}

// Specify the path to your ASS file
const assFilePath = 'subtitles.ass';

// Process the ASS file and generate images
processAssFile(assFilePath).then(() => {
    const staticImages = ['uploads/step_1.png', 'uploads/step_2.png', 'uploads/step_3.png', 'uploads/step_4.png', 'uploads/step_5.png'];
    const audioPath = 'uploads/song.mp3';
    const subtitleImages = fs.readdirSync('output').filter(file => file.startsWith('dialogue_')).map(file => `output/${file}`);

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

    const createVideoClip = (imagePath, outputPath) => {
        return new Promise((resolve, reject) => {
            videoshow([imagePath], videoOptions)
                .save(outputPath)
                .on('start', function (command) {
                    console.log('ffmpeg process started:', command);
                })
                .on('error', function (err, stdout, stderr) {
                    console.error('Error:', err);
                    console.error('ffmpeg stderr:', stderr);
                    reject(err);
                })
                .on('end', function (output) {
                    console.log('Video created in:', output);
                    resolve(output);
                });
        });
    };

    const generateVideoClips = async () => {
        const videoClips = [];

        for (let i = 0; i < staticImages.length; i++) {
            const outputPath = `output/clip_${i + 1}.mp4`;
            await createVideoClip(staticImages[i], outputPath);
            videoClips.push(outputPath);
        }

        for (let i = 0; i < subtitleImages.length; i++) {
            const outputPath = `output/subtitle_clip_${i + 1}.mp4`;
            await createVideoClip(subtitleImages[i], outputPath);
            videoClips.push(outputPath);
        }

        return videoClips;
    };

    generateVideoClips().then((videoClips) => {
        const finalVideoOptions = {
            fps: 25,
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
        
        videoshow(videoClips, finalVideoOptions)
            .audio(audioPath)
            .save('video_with_subtitles.mp4')
            .on('start', function (command) {
                console.log('ffmpeg process started:', command);
            })
            .on('error', function (err, stdout, stderr) {
                console.error('Error:', err);
                console.error('ffmpeg stderr:', stderr);
            })
            .on('end', function (output) {
                console.log('Video created in:', output);
            });
    }).catch((err) => {
        console.error('Error generating video clips:', err);
    });
});
