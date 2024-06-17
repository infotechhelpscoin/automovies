const MongoHelper = require('./mongo.js');

const mongoURL = 'mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/';
const dbName = 'tradingdb';
const { ObjectId } = require('mongodb');
async function dbinsert(collection, values) {
  const mongoHelper = new MongoHelper(mongoURL, dbName);
  await mongoHelper.connect();
  const insertResult = await mongoHelper.insertIntoCollection(collection, values);
  console.log('Inserted document:', insertResult.insertedId);
  await mongoHelper.disconnect();
  return 'Inserted document:' + insertResult.insertedId;
}
async function dbsearch(collection, filters) {
  const mongoHelper = new MongoHelper(mongoURL, dbName);
  await mongoHelper.connect();
  const searchResult = await mongoHelper.searchCollection(collection, filters);
  console.log('Search result:', searchResult);
  await mongoHelper.disconnect();
  return searchResult;
}
async function dbupdate(collection,filter,values){
    const mongoHelper = new MongoHelper(mongoURL, dbName);
    await mongoHelper.connect();
 const updateResult = await mongoHelper.updateCollection(collection, filter, { $set: values });
  console.log('Updated document:', updateResult.modifiedCount);
  await mongoHelper.disconnect();
    return 'Updated document:'+ updateResult.modifiedCount;
}
async function dbgetItem(collectionName, itemId)
{
    const mongoHelper = new MongoHelper(mongoURL, dbName);
    await mongoHelper.connect();
    const collection = await this.getCollection(collectionName);
    await mongoHelper.disconnect();
    return await collection.findOne({ _id: new ObjectId(itemId) });
}
module.exports={
    dbgetItem,dbinsert,dbsearch,dbupdate
}