// const { cloudinary} = require("../config/cloudinaryConfig");
const { getCollections } = require("../mongoConnection");
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { ObjectId } = require('mongodb');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
});

async function uploadVideoToCloudinary(videoFilePath) {
  try {
    // Upload the video file to Cloudinary
    const result = await cloudinary.uploader.upload(videoFilePath, {
      resource_type: "video",
    });

    // Log the result (optional)
    // console.log('Upload result:', result);

    return result.secure_url; // Return the secure URL of the uploaded video
  } catch (error) {
    const errorMessage = `Error uploading video '${videoFilePath}' to Cloudinary: ${error.message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}


async function uploadVideoLinkToMongoDB(videoLink, scheduleId) {
  const { scheduleCollection } = await getCollections();
  try {
    // Convert string ID to ObjectId if necessary
    const objectId = new ObjectId(scheduleId);
    console.log("objectId", objectId);
    // Update the document with new videoLink and update status to videoGenerated
    const result = await scheduleCollection.updateOne(
      { _id: objectId }, // Filter document by _id
      { 
        $set: {
          videoLink: videoLink, // Add or update videoLink
          status: "videoGenerated" // Update status
        }
      }
    );

    if (result.modifiedCount === 0) {
      console.log("No document found with the given ID or no changes were made.");
    } else {
      console.log("Document updated successfully.");
    }
  } catch (error) {
    console.error("Error updating the document in MongoDB:", error);
  }


  // try {
  //   // Insert document with videoLink and default status
  //   const result = await scheduleCollection.insertOne({
  //     videoLink: videoLink,
  //     status: "review",
  //     topicId: topicId,
  //   });
  //   console.log(`Video link uploaded to MongoDB with ID: ${result.insertedId}`);
  //   if (result.insertedId) {
  //     // Update all matching documents in the MidjourneyImages collection
  //     const updateResult = await midjourneyImageCollection.updateMany(
  //       { topicId: topicId }, // Filter documents by topicId
  //       { $set: { videoStatus: "created" } } // Set new property videoStatus to "created"
  //     );

  //     console.log(
  //       `Updated ${updateResult.matchedCount} documents with videoStatus set to 'created'`
  //     );
  //   }
  // } catch (error) {
  //   console.log(`Error uploading video link to MongoDB: ${error}`);
  //   const errorMessage = `Error uploading video for topic id ${topicId} to mongodb: ${error.message}`;
  //   console.error(errorMessage);
  //   throw new Error(errorMessage);
  // } 
}

module.exports = {
  uploadVideoToCloudinary, uploadVideoLinkToMongoDB
}