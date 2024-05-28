const { ensureChatGPTAPI,  ChatGPTAPI } = require('../config/gptConfig');
require('dotenv').config();
const {  ObjectId } = require('mongodb');
const { v4: uuidv4 } = require("uuid");
const { getCollections } = require('../mongoConnection');

// todo GPTRun function create for fetchStories, GPTRunForEach function create for explainStories, bulkInsertDocuments function create for setupMidJourneyImages,setupMidJourneyImages renamed to saveMidjourneyPrompts
// todo fake data for modified channel
 

async function main(modifiedChannel, scheduleTaskId) {
  // console.log("schedule Task Id inside main ", scheduleTaskId);
  // console.log("modified channel inside main", modifiedChannel);

  try {
    await ensureChatGPTAPI()
    const stories = await fetchStories(modifiedChannel);
    console.log('stories inside main', stories)
    const storyDetails = await explainStories(modifiedChannel, stories);
    const midJourneyPrompts = await generateMidJourneyPrompts(
      modifiedChannel,
      storyDetails
    );
// console.log(
//   'midjourney prompt', midJourneyPrompts
// )
    const topicId = await saveMidjourneyPrompts(midJourneyPrompts, scheduleTaskId);

    
  } catch (error) {
    console.error("Error in main function:", error);
    return null;
  }
}


async function fetchStories(modifiedChannel) {
  const stories = await GPTRun(
    modifiedChannel.Motivation.GetStoriesList
  );
  if (!stories || stories.length === 0)
    throw new Error("No stories returned from GPT run.");
  // console.log("Stories List inside fetchStories:", stories);
  return stories;
}

async function GPTRun(prompt) {
  const ChatGPTAPI = await ensureChatGPTAPI();
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
    completionParams: {
      model: 'gpt-3.5-turbo-0125',
    }
  });

  const res = await api.sendMessage(prompt);
  // console.log('response from gpt', res.text);
 let result= convertMarkdownToJsonArray(res.text)
  return result;

}

let errorcount=0;
function convertMarkdownToJsonArray (markdownString){
  let jsonArray=[];
  try {
  // Remove the Markdown code block formatting
  const jsonString = markdownString.replace(/^```json\s+/, '').replace(/\s+```$/, '');

  // Parse the JSON string into a JavaScript object
  jsonArray = JSON.parse(jsonString);
} catch (e) {
  console.log('error in markdown', errorcount++);

}
  return jsonArray;
}


async function explainStories(modifiedChannel, stories) {
  let attempts = 0;
  const maxAttempts = 3; // Maximum number of retries

  while (attempts < maxAttempts) {
    const storyDetails = await GPTRunForEach(
      modifiedChannel.Motivation.ExplainStory,
      "{O2}",
      stories
    );
    console.log("Explained stories:", storyDetails);

    // Check if the result is sufficient
    if (storyDetails && storyDetails.length >= 2) {
      return storyDetails;
    }

    // Increment the attempt counter if the result is insufficient
    attempts++;

    console.log(`Attempt ${attempts}: Insufficient data returned, retrying...`);
  }

  // If this point is reached, maximum attempts were made without success
  throw new Error("No or insufficient explain story returned from GPTRunForEach after several attempts.");
}


async function GPTRunForEach(mainPrompt, substringToReplace, replaceWithStringArray) {
  let outputArray = [];
  if(true){
    for (let i = 0; i < replaceWithStringArray.length; i++) {
        let prompt = replaceWithStringArray[i];
        let replaceWithString =await JSON.stringify(replaceWithStringArray[i]);

        finalPrompt= mainPrompt.replace(substringToReplace,replaceWithString);
     //   console.log(finalPrompt)
    result=await GPTRun(finalPrompt);
    if (result.length) outputArray.push(...result);
    // console.log(outputArray.length);
    }
   // console.log(outputArray);
  }
    return outputArray
}




//   try {
//     // Map each string in the array to a promise that resolves to the API call result
//     const results = await Promise.all(replaceWithStringArray.map(async (item) => {
//       const replaceWithString = JSON.stringify(item);
//       const finalPrompt = mainPrompt.replace(substringToReplace, replaceWithString);
//       const result = await GPTRun(finalPrompt);
//       return result;
//     }));

//     // Flatten the results and filter out empty results
//     outputArray = results.flat().filter(item => item && item.length);
//   } catch (error) {
//     console.error('Error in GPTRunForEach:', error);
//     throw new Error(`Failed to process all items: ${error.message}`);
//   }

//   return outputArray;
// }

async function generateMidJourneyPrompts(modifiedChannel, storyDetails) {
  let attempts = 0;
  const maxAttempts = 3; // Set the maximum number of retries

  while (attempts < maxAttempts) {
    try {
      const prompts = await GPTRunForEach(
        modifiedChannel.Motivation.MidjourneyRunPrompt,
        "{O2}",
        storyDetails
      );

      // console.log("Generated prompts:", prompts);

      // Check if the number of prompts is sufficient
      if (prompts && prompts.length >= 2) {
        return prompts;
      }

      // If not sufficient, log and increment attempts before retrying
      attempts++;
      console.log(`Attempt ${attempts}: Insufficient MidJourney prompts returned, retrying...`);

    } catch (error) {
      console.error(`Error on attempt ${attempts} generating MidJourney prompts: ${error}`);
      // Increment attempts as there was an error
      attempts++;
    }

    // Optional: Add a short delay before retrying, can be useful if the issue might be temporary (e.g., rate limits)
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // If max attempts reached and still no success, throw an error
  throw new Error("Failed to generate sufficient MidJourney prompts after several attempts.");
}




async function saveMidjourneyPrompts(prompts, scheduleTaskId) {
  try {
    const topicId = uuidv4();
    // const imageId = uuidv4();
    prompts.forEach((prompt) => {
      prompt.topicId = topicId;
      prompt.imageId = uuidv4()
      prompt.status = "Notstarted";
      prompt.scheduleTaskId = scheduleTaskId;
    });
    console.log('json array for bulk insert', prompts)
    await bulkInsertDocuments(scheduleTaskId, prompts);
    // return topicId;
  } catch (error) {
    console.error(`Error setting up MidJourney images: ${error}`);
    throw new Error(`Failed to setup MidJourney images: ${error.message}`);
  }
}

async function bulkInsertDocuments(scheduleId, jsonArray) {
  const { scheduleCollection } = await getCollections();

  try {
    if (jsonArray.length === 0) {
      console.log("No data provided for update.");
      return null;
    }

    // Assuming we are appending jsonArray to a field called 'images'
    const result = await scheduleCollection.updateOne(
      { _id: new ObjectId(scheduleId) },
      { 
        $push: { images: { $each: jsonArray } }, 
        $set: { status: "promptGenerated" }  
      },
      { upsert: true } 
    );

    console.log(`Updated documents with _id ${scheduleId}, modified count: ${result.modifiedCount}`);
    return result;
  } catch (error) {
    console.error(`Error updating documents in scheduleCollection:`, error);
    throw new Error(`Failed to update documents: ${error.message}`);
  }
}

// todo this is only for test purpose
async function callMainWithTaskId( ) {
  // Extracting the scheduleTaskId from the document
  const modifiedChannel = {
    Motivation: {
      GetStoriesList: 'Only respond in Json Format in format: [<topic1 >,<topic2>,...]. Please provide 1 Topics for a Life Pro Tips topics channel. We will share 5 quotes each day on 1 topic.',
      ExplainStory: 'Only respond in Json Format [{"topic": "<>","quote": "<>"},...]. Give me 5 quotes on the topic {O1}',
      MidjourneyRunPrompt: 'I want to generate image on which i can show these quotes . Please provide a prompt for image generation for each of the provided quote in a json format [{"topic": "<>","quote": "<>","prompt":"<>"},...] . Quotes are following {O2}',
      SocailTags: 'Please provide Social Media Tags, Topic Title, Thumbnail suggestion for this topic O1',
      CloudinaryConfig: {}
    }
  }
  const scheduleTaskId = '663f8d2a9c92cf9514a8796a'
  try {
     const result = await main(modifiedChannel, scheduleTaskId);
    console.log("Result from main function:", result);
    return result;
  } catch (error) {
    console.error("Error calling main function:", error);
    throw new Error("Failed to execute main function");
  }
}

// callMainWithTaskId()

module.exports = {main}