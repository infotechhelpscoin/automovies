// mongo.js
const { MongoClient, ObjectID } = require('mongodb');
require("dotenv").config();

const uri = 'mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/enayetTest'

const client = new MongoClient(uri, {
    tls: true,  
  });
  let db;

async function connect() {
    try {
        await client.connect();  // Attempt to connect
        db = client.db(); // Assigns the database handle
    } catch (error) {
        console.error("Connection to MongoDB failed:", error);
        throw error; // Rethrow or handle error appropriately
    }
    return db;
}

async function getDb() {
    if (!db) {
        await connect();
    }
    return db;
}

async function getCollections() {
    const db = await getDb();
    return {
        userCollection: db.collection("user"),
        seriesCollection: db.collection("series"),
        scheduleCollection: db.collection("video_schedules"),
        midjourneyImageCollection: db.collection("MidjourneyImages"),
        videoCollection: db.collection("FinalVideo")
    };
}

// const { userCollection, seriesCollection, scheduleCollection, midjourneyImageCollection, videoCollection } = await getCollections()

module.exports = { connect, client, db, getCollections };



// at present, I organized the work as follows. 
// 1. The user will log in and his data will be stored in the userCollection.
// 2. if the user selects a topic it will be stored in the seriesCollection.
// 3. if user wants to post the series then user's youtube credential is saved to the userCollection and 30 documents are created in the scheduleCollection for posting 30 videos. Each document contains fields seriesId, status, videoSchedule, and result.
// 4. A function runs at our server every 10 min and searches videoSchedule collection for documents that scheduled time arrives and status is pending or failed. 
// 5. A for loop run for all the pending / failed items
// 6. For each task sequence of function run as follows
// 7. chatgpt is asked to create a topic name, 5 quote for that topic, 5 prompt for midjourney image generation. 
// 8. They are saved in the midJourney Images collection in the database. fields are as follows, topic, quote, prompt, topicId, Imagestatus, seriesId. Topic, topicId and seriesId are same for all 5 saved documents.
// 9. In the process a cron job is run that takes seriesId as input and search midJourney Images collection with the seriesId and find out document that status is notStarted and take prompt connect with midjourney API to 
// 8. Using the chatgpt prompt image generate from the midJourney. 
// 9. 
// A cron job is run here as there are several stage involved to generate final image. 
// 8. They are saved in the midjourneyImages collection. Each time 5 documents. each contains files like, topic, quote, prompt, topicId, Imagestatus, seriesId, midJourneytaskId 