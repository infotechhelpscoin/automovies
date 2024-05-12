const { getCollections } = require("../mongoConnection");
const { generateVideo } = require("../utilities/generateVideo");

async function videoGenerationSchedule () {
  const { scheduleCollection } = await getCollections()
  try {
    const document = await scheduleCollection.findOne({ status: "imageGenerated" });
    if (document && document.images && document.images.length > 0) {
      const topicId = document.images[0].topicId; // Assuming you want the topicId of the first image
      const result = generateVideo(topicId, document)
      
      // console.log("Topic ID:", topicId);
      return topicId;
    } else {
      console.log("No document found with 'imageGenerated' status or no images in the document.");
      return null; // Return null if no suitable document or images are found
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return null; // Handle errors and possibly return null or throw an error
  }
}


//todo this is for test purpose
async function CallVideoGenerator( ) {
  
  try {
     const result = await videoGenerationSchedule()
    // console.log("Result from main function:", result);
    // return result;
  } catch (error) {
    console.error("Error calling main function:", error);
    // throw new Error("Failed to execute main function");
  }
}

CallVideoGenerator()

module.exports = { videoGenerationSchedule }