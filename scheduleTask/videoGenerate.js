const { getCollections } = require("../mongoConnection");
const { generateVideo } = require("../utilities/generateVideo");

async function videoGenerationSchedule () {
  const { scheduleCollection } = await getCollections()
  try {
    const document = await scheduleCollection.findOne({ status: "imageGenerated" });
    if (document && document.images && document.images.length > 0) {
      const topicId = document.images[0].topicId; 
      const result = await generateVideo(topicId, document)
      if(result){
        console.log(`Video generation successful for schedule id ${document._id}`)
      }else {
        console.log(`Video generation failed for schedule id ${document._id}`)
      }
    } else {
      console.log("No document found with 'imageGenerated' status or no images in the document.");
    }
  } catch (error) {
    console.error("Error fetching document:", error);
  }
}


//todo this is for test purpose
// async function CallVideoGenerator( ) {
  
//   try {
//      const result = await videoGenerationSchedule()
//     // console.log("Result from main function:", result);
//     // return result;
//   } catch (error) {
//     console.error("Error calling main function:", error);
//     // throw new Error("Failed to execute main function");
//   }
// }

// CallVideoGenerator()

module.exports = { videoGenerationSchedule }