import ExplainerService from './explainer.service.js';
import fs from 'fs';
import path from 'path'
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const addExplainerRequest = async (req, res) => {
//   console.log('hello for postman')
//   // try {
//   //   console.log('route hit')
//   //   const { files } = req;
//   //   const videoPath = files.video[0].path;
//   //   const transcriptionPath = files.transcription[0].path;

//   //   const transcription = fs.readFileSync(transcriptionPath, 'utf-8');
//   //   const newRequest = await ExplainerService.createExplainerRequest(videoPath, transcription);

//   //   res.status(200).send(newRequest);
//   // } catch (error) {
//   //   res.status(500).send({ message: 'Error adding request', error });
//   // }
// };


const addExplainerRequest = async (req, res) => {
  try {
    const { files } = req;
    const videoPath = files.video[0].path;
    const transcriptionPath = files.transcription[0].path;

    // Save both paths to the database
    const newRequest = await ExplainerService.createExplainerRequest(videoPath, transcriptionPath);

    res.status(200).send(newRequest);
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: 'Error adding request', error });
  }
};

export default {
  addExplainerRequest
};
