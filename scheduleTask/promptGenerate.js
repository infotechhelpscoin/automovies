const { ensureChatGPTAPI } = require("../config/gptConfig");
const { getCollections } = require("../mongoConnection");
const { modifyChannelForGPT } = require("../utilities/chatGPT");
const { main } = require("../utilities/mainGPT");


async function gptPromptGenerate () {
  const { scheduleCollection, userCollection, seriesCollection } = await getCollections();

  const pendingTasks = await scheduleCollection.find({ status: "pending" }).toArray();

  // console.log('pending tasks', pendingTasks)
  const chatGPTAPI = await ensureChatGPTAPI();
  
  for(const task of pendingTasks){

   const gptMainPromptFormat = modifyChannelForGPT(task.seriesName)
  //  console.log(gptMainPromptFormat)
   const scheduleTaskId = task._id.toString()
    await main(gptMainPromptFormat, scheduleTaskId)

  }

}

module.exports = gptPromptGenerate;


