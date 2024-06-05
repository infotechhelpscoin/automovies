import cron from 'node-cron';
import ExplainerService from './explainer.service.js';
import ExplainerVideoService from './explainer.videoService.js';

// Cron job to check for pending video requests every minute
// cron.schedule('* * * * *', async () => {
//   console.log('Running cron job to check for pending video requests');
//   try {
//     const pendingImageProcessingRequests = await ExplainerService.fetchPendingExplainerRequests();

//   for (const request of pendingImageProcessingRequests) {
//     try {
//       console.log(`Processing request with ID: ${request._id}`);
//       const concatenatedImage = await ExplainerService.processVideoRequest(request);
//       console.log(`Processed request with ID: ${request._id}, concatenated image: ${concatenatedImage}`);
//     } catch (error) {
//       console.error(`Error processing request with ID: ${request._id}`, error);
//     }
//   }
//   } catch (error) {
//     console.error(`Error in cron job`, error);
//   }
// });

async function test () {
  try {
    const pendingImageProcessingRequests = await ExplainerService.fetchPendingExplainerRequests();

  for (const request of pendingImageProcessingRequests) {
    try {
      console.log(`Processing request with ID: ${request._id}`);
      const concatenatedImage = await ExplainerService.processVideoRequest(request);
      console.log(`Processed request with ID: ${request._id}`);
    } catch (error) {
      console.error(`Error processing request with ID: ${request._id}`, error);
    }
  } 

  const pendingVideoProcessingRequests = await ExplainerVideoService.fetchPendingVideoRequests();

  // console.log('pendingVideoProcessingRequests', pendingVideoProcessingRequests)
if(pendingVideoProcessingRequests){
  
  try {
    console.log(`Processing started for video generation for document ID: ${pendingVideoProcessingRequests._id}`);
    const generatedVideo = await ExplainerVideoService.processVideoGeneration(pendingVideoProcessingRequests);
    console.log(`Processed video generation with document ID: ${pendingVideoProcessingRequests._id}, generated video: ${generatedVideo}`);
  } catch (error) {
    console.error(`Error processing video generation for document with ID: ${pendingVideoProcessingRequests._id}`, error);
  }
  }else{
    console.log('No data available for video processing')
}

  } catch (error) {
    console.error(`Error in cron job`, error);
  }
}

test()
