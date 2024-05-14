const { refreshAccessToken, oAuth2Client } = require("../config/googleOAuth");
const { getCollections } = require("../mongoConnection");
const { downloadVideoFromCloudinary } = require("../utilities/upload");
const fs = require("fs");
const path = require("path");
const { google } = require('googleapis');
const {  ObjectId } = require('mongodb');
const fsp = require('fs').promises; 

async function uploadToYoutube (){
  const { scheduleCollection } = await getCollections()

  try {
  const documents = await scheduleCollection.find({
    status: "videoGenerated",
    scheduleTime: { $lte: new Date() },
    videoLink: { $exists: true, $ne: "" },
    refreshToken: { $exists: true, $ne: "" }  
  }).toArray();

  if (documents.length === 0) {
    console.log("No documents found where the schedule time has reached or passed, and videoLink and refreshToken are present.");
  } 
  
    for (const document of documents){
      const result = await processingUpload(document)
    }
}  catch (error) {
    console.error("Error fetching documents inside upload youtube schedule:", error);
  }
}


async function processingUpload(document){

  try {
    const newAccessToken = await refreshAccessToken(document.refreshToken);
    console.log('token', newAccessToken)

    oAuth2Client.setCredentials({
      access_token: newAccessToken,
      refresh_token: document.refreshToken,
    });

    await upload(document)

  } catch (error) {
    console.error(`Error processing upload for document ID ${document._id}:`, error);
  }
}


async function upload(document) {
  const scheduleId = document._id.toString()
  const videoFileName = `${scheduleId}_finalVideo.mp4`;
  const videoFilePath = path.join(__dirname,'..', '/tempFolder', videoFileName);
  const url = document.videoLink;
  const title = document.images[0].topic
  
  try {
    await downloadVideoFromCloudinary(url, videoFilePath)

  const youtube = google.youtube({
      version: "v3",
      auth: oAuth2Client,
    });

  const response = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: title,
      },
      status: {
        privacyStatus: "private",
      },
    },
    media: {
      body: fs.createReadStream(videoFilePath),
    },
  });
  console.log(`Video uploaded: ID ${response.data.id} for topic id ${document.images[0].topicId}`);
  
  // Check if YouTube video upload returned a valid ID
  if (response.data.id) {
    console.log(`Video uploaded: ID ${response.data.id} for topic id ${document.images[0].topicId}`);

    // Update the status in the MongoDB document
    await updateDocumentStatus(scheduleId, 'uploadedVideo');
    return response.data.id;
  } else {
    throw new Error("YouTube did not return a valid video ID.");
  }

} catch (error) {
  console.error(`Failed to upload to YouTube: ${error.message} for document ID ${document._id}`);
    throw error;
}finally {
  // Attempt to delete the temporary video file regardless of the previous outcomes
  try {
    await fsp.unlink(videoFilePath);
    console.log(`Successfully deleted temporary file: ${videoFilePath}`);
  } catch (deleteError) {
    console.error(`Failed to delete temporary file: ${videoFilePath}`, deleteError);
  }
}
}

async function updateDocumentStatus(documentId, newStatus) {
  const { scheduleCollection } = await getCollections();
  try {
    const result = await scheduleCollection.updateOne(
      { _id: new ObjectId(documentId) },
      { $set: { status: newStatus } }
    );
    if (result.matchedCount === 0) {
      console.error("No document found with the specified ID to update.");
    } else if (result.modifiedCount === 0) {
      console.error("Document found but the status was not updated.");
    } else {
      console.log(`Document status updated successfully to '${newStatus}' for document ID ${documentId}.`);
    }
  } catch (error) {
    console.error(`Error updating document status for ID ${documentId}:`, error);
    throw error;
  }
}

//todo this is for test purpose
// async function CallUpload( ) {
  
//   try {
//      const result = await uploadToYoutube()
//     // console.log("Result from main function:", result);
//     // return result;
//   } catch (error) {
//     console.error("Error calling main function:", error);
//     // throw new Error("Failed to execute main function");
//   }
// }

// CallUpload()

module.exports = { uploadToYoutube }