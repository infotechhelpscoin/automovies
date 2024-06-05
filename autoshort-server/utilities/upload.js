// const { cloudinary} = require("../config/cloudinaryConfig");
const { default: axios } = require("axios");
const { getCollections } = require("../mongoConnection");
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { ObjectId } = require('mongodb');
const fs = require("fs");

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
    const objectIdString = scheduleId['$oid'] ? scheduleId['$oid'] : scheduleId;
    const objectId = new ObjectId(objectIdString);
    
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


}

async function downloadVideoFromCloudinary(url, outputPath) {
  try {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  const writer = fs.createWriteStream(outputPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
} catch (error) {
  console.error("Error downloading the video:", error);
  throw error;  
}
}




module.exports = {
  uploadVideoToCloudinary, uploadVideoLinkToMongoDB,
  downloadVideoFromCloudinary
}