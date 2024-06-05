const { default: axios } = require("axios");
const { getCollections } = require("../mongoConnection")
require('dotenv').config();

async function generateMidjourneyImages (){
const { scheduleCollection } = await getCollections()
try {
   // Find documents with status "Notstarted"
   const notStartedImages = await scheduleCollection.find({
    "images": {
      $elemMatch: {
        "status": "Notstarted"
      }
    }
  }).limit(2).toArray();
 
  console.log('not started images array', notStartedImages)
 
  const inProgressImages = await scheduleCollection.find({
    "images": {
      $elemMatch: {
        "status": "InProgess"  
      }
    }
  }).limit(2).toArray();
  
  const upscalePendingImages = await scheduleCollection.find({
    "images": {
      $elemMatch: {
        "status": "upscalePending"
      }
    }
  }).limit(2).toArray();
  
  for (const document of notStartedImages) {
    for (const image of document.images) {
      if (image.status === "Notstarted") {
        await waitRandom(10000);
        const prompt = image.prompt;
        // console.log(`Generating image for ${image.imageId} ..  ${prompt}...`);
        const task_id = await generateImage(prompt);
        // console.log(task_id);
  
        // Update the status to "InProgess" and save the task_id related to the specific imageId
        if (task_id) {
          await scheduleCollection.updateOne(
            { "_id": document._id, "images.imageId": image.imageId },
            { $set: { "images.$.status": "InProgess", "images.$.task_id": task_id } }
          );
          console.log(`Image generated for ${image.imageId} from notStarted loop`);
        }
      }
    }
  }
  
  for (const document of inProgressImages) {
    for (const image of document.images) {
      if (image.status === "InProgess") {
        await waitRandom(10000);
        const task_id = image.task_id;
        // console.log(`Checking image in progress for ${image.imageId} ..  ${task_id}...`);

        const { status, image_url } = await fetchImageStatus(task_id);

        console.log('midjourney status and image inside inProgress loop', status, image_url);
  
        // Update the status and image_url if the image processing is finished
        if (status === 'finished' && image_url) {
          await scheduleCollection.updateOne(
            { "_id": document._id, "images.imageId": image.imageId },
            { $set: { "images.$.status": "upscalePending", "images.$.image_url": image_url } }
          );
  
          console.log(`Image status updated for ${image.imageId} inside inprogress loop`);
  
          // Upscale the image and update the upscaleTaskId
          const upscaleTaskId = await upscaleImage(task_id);

          await scheduleCollection.updateOne(
            { "_id": document._id, "images.imageId": image.imageId },
            { $set: { "images.$.upscaleTaskId": upscaleTaskId } }
          );
  
          console.log(`Inprogress task finished for ${image.imageId}`);
        }
      }
    }
  }
  
  for (const document of upscalePendingImages) {
    for (const image of document.images) {
      if (image.status === "upscalePending") {
        await waitRandom(10000);
        const task_id = image.upscaleTaskId;

        // console.log(`Checking upscale image for ${image.imageId} ..  ${task_id}...`);

        const { status, image_url } = await fetchImageStatus(task_id);
        
        // console.log('upscale pending image status and url', status, image_url);
        // Update the status and upscale image URL if the upscale process is finished
        if (status === 'finished' && image_url) {
          await scheduleCollection.updateOne(
            { "_id": document._id, "images.imageId": image.imageId },
            { $set: { "images.$.status": "finished", "images.$.upscaleImage_url": image_url } }
          );
          console.log(`Upscale image generated for ${image.imageId}`);
        }
      }
    }
  }
  
  await updateDocumentStatus(scheduleCollection)


} catch (error) {
  console.error('Error in cron job Midjourney image:', error);
}
}

async function waitRandom(miliSeconds)
{
const randomWaitTime = Math.floor(Math.random() * miliSeconds);
console.log(randomWaitTime);
await new Promise(resolve => setTimeout(resolve, randomWaitTime));
}

async function generateImage(prompt) {
  let promptcomplete = prompt;
  // console.log(promptcomplete);
  
  let data = JSON.stringify({
      "prompt": promptcomplete,
      "aspect_ratio": "4:3",
      "process_mode": "relax",
      "webhook_endpoint": "",
      "webhook_secret": ""
  });
  
  let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.midjourneyapi.xyz/mj/v2/imagine',
      headers: { 
        'X-API-KEY': process.env.MIDJOURNEY_API_KEY, 
        'Content-Type': 'application/json'
      },
      data: data
  };
  
  try {
    let response = await axios.request(config);
    // console.log('Res from midjourney generte Image funtion', response)
    return response.data.task_id;
  } catch (error) {
    console.error(`Error generating image: ${error}`);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}
   
async function fetchImageStatus(task_id) {
  const endpoint = 'https://api.midjourneyapi.xyz/mj/v2/fetch';

  const data = { task_id: task_id };
  try {
    let res = await axios.post(endpoint, data);
    if (res.data && res.data.status === 'finished') {
      return {"status": res.data.status, "image_url": res.data.task_result.image_url};
    }
    return {"status": res.data.status};
  } catch (error) {
    console.error(`Error fetching image status for task_id ${task_id}: ${error}`);
    throw new Error(`Failed to fetch image status: ${error.message}`);
  }
}

async function upscaleImage(task_id){

  data = {
    "origin_task_id": task_id,
    "index": "1",
    "webhook_endpoint": "",
    "webhook_secret": ""
}

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://api.midjourneyapi.xyz/mj/v2/upscale',
  headers: { 
    'X-API-KEY': process.env.MIDJOURNEY_API_KEY, 
    'Content-Type': 'application/json'
  },
  data: data
};

try {
  let response = await axios.request(config);
  return response.data.task_id;
} catch (error) {
  console.error(`Error upscaling image for task_id ${task_id}: ${error}`);
  throw new Error(`Failed to upscale image: ${error.message}`);
}

}

async function updateDocumentStatus(scheduleCollection) {
  try {
    const documentsToUpdate = await scheduleCollection.aggregate([
      {
        $match: {
          status: "promptGenerated",
          // images: { $size: 5 } // ensures there are exactly 5 images
        }
      },
      {
        $addFields: {
          allImagesFinished: {
            $allElementsTrue: {
              $map: {
                input: "$images",
                as: "image",
                in: { $eq: ["$$image.status", "finished"] }
              }
            }
          }
        }
      },
      {
        $match: {
          allImagesFinished: true
        }
      }
    ]).toArray();

    // Step 2: Update Documents if conditions are met
    for (const doc of documentsToUpdate) {
      await scheduleCollection.updateOne(
        { _id: doc._id },
        { $set: { status: "imageGenerated" } }
      );
      console.log(`Document with ID ${doc._id} updated to 'imageGenerated'.`);
    }
  } catch (error) {
    console.error("Failed to update document statuses:", error);
  }
}


//todo this is for test purpose
async function CallMidjourney( ) {
  
  try {
     const result = await generateMidjourneyImages()
    console.log("Result from main function:", result);
    return result;
  } catch (error) {
    console.error("Error calling main function:", error);
    throw new Error("Failed to execute main function");
  }
}

// CallMidjourney()



module.exports = { generateMidjourneyImages }