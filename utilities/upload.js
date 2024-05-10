const { cloudinary} = require("../config/cloudinaryConfig");
const { getCollections } = require("../mongoConnection");

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


async function uploadVideoLinkToMongoDB(videoLink, topicId) {
  const { midjourneyImageCollection, videoCollection } = await getCollections();
  try {
    // Insert document with videoLink and default status
    const result = await videoCollection.insertOne({
      videoLink: videoLink,
      status: "review",
      topicId: topicId,
    });
    console.log(`Video link uploaded to MongoDB with ID: ${result.insertedId}`);
    if (result.insertedId) {
      // Update all matching documents in the MidjourneyImages collection
      const updateResult = await midjourneyImageCollection.updateMany(
        { topicId: topicId }, // Filter documents by topicId
        { $set: { videoStatus: "created" } } // Set new property videoStatus to "created"
      );

      console.log(
        `Updated ${updateResult.matchedCount} documents with videoStatus set to 'created'`
      );
    }
  } catch (error) {
    console.log(`Error uploading video link to MongoDB: ${error}`);
    const errorMessage = `Error uploading video for topic id ${topicId} to mongodb: ${error.message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  } 
}

module.exports = {
  uploadVideoToCloudinary, uploadVideoLinkToMongoDB
}