const { getCollections } = require("../mongoConnection");
const { modifyChannelForGPT } = require("../utilities/chatGPT");
const { main } = require("../utilities/mainGPT");


async function gptPromptGenerate () {
  const { scheduleCollection, userCollection, seriesCollection } = await getCollections();

  const pendingTasks = await scheduleCollection.find({ status: "pending" }).toArray();
  
  for(const task of pendingTasks){

   const gptMainPromptFormat = modifyChannelForGPT(task.seriesName)
  //  console.log(gptMainPromptFormat)
   const scheduleTaskId = task._id.toString()
   const success = await main(gptMainPromptFormat, scheduleTaskId);

   if (!success) {
     console.error(`Task with ID ${scheduleTaskId} failed.`);
  
   } else {
     console.log(`Task with ID ${scheduleTaskId} completed successfully.`);
   }
  }

}

module.exports = gptPromptGenerate;


