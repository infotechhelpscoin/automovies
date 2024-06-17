const MongoClient = require('mongodb').MongoClient;

class MongoHelper {
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
  }

  async connect() {
    this.client = await MongoClient.connect(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.db = this.client.db(this.dbName);
  }

  async disconnect() {
    await this.client.close();
  }

  async getCollection(collectionName) {
    return this.db.collection(collectionName);
  }

  async getCollectionsList() {
    return await this.db.listCollections().toArray();
  }

  async searchCollection(collectionName, query) {
    const collection = await this.getCollection(collectionName);
    return await collection.find(query).toArray();
  }

  async insertIntoCollection(collectionName, document) {
    const collection = await this.getCollection(collectionName);
    return await collection.insertOne(document);
  }

  async updateCollection(collectionName, filter, update) {
    const collection = await this.getCollection(collectionName);
    return await collection.updateOne(filter, update);
  }
}

module.exports = MongoHelper;