// mongo.js
const { MongoClient, ObjectID } = require('mongodb');
require("dotenv").config();

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.2pwq0w2.mongodb.net/tradingdb`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
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