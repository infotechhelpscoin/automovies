import { exec } from 'child_process';
import fs from 'fs';
import { spawn } from 'child_process';

// Ensure logs directory exists
if (!fs.existsSync('./videos')) {
  fs.mkdirSync('./videos');
}

const commandToRun = 'npm install express';
const videoPath = './videos/install_express.mp4';

// Function to run a command and record the terminal activity
const runAndRecordCommand = (command, outputPath) => {
  // Start ffmpeg to record the terminal
  const ffmpeg = spawn('ffmpeg', [
    '-y', // Overwrite output files without asking
    '-f', 'x11grab', // Grab the X11 display
    '-s', '1920x1080', // Set the frame size
    '-i', ':0.0', // Display to record, change if needed
    '-r', '25', // Set the frame rate
    '-q:v', '1', // Set the quality level
    outputPath
  ]);

  ffmpeg.stderr.on('data', (data) => {
    console.error(`ffmpeg error: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
  });

  // Run the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command ${command}: ${stderr}`);
    } else {
      console.log(`Command ${command} executed successfully: ${stdout}`);
    }

    // Stop ffmpeg after command execution
    ffmpeg.kill('SIGINT');
  });
};

runAndRecordCommand(commandToRun, videoPath);
