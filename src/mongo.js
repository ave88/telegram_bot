const mongoClient = require('mongodb').MongoClient
const config = require('../configs/config.js')

const dbUrl = config.dbUrl
const dbName = config.dbName
const dbCollectionSubs = config.dbCollectionSubs
const dbCollectionUsers = config.dbCollectionUsers
const dbCollectionUnsuppLinks = config.dbCollectionUnsuppLinks

module.exports = class Mongo {
  async startMongo () {
    try {
      const client = await mongoClient.connect(dbUrl)
      this.subsCollection = client.db(dbName).collection(dbCollectionSubs)
      this.userCollection = client.db(dbName).collection(dbCollectionUsers)
      this.unsupplinksCollection = client.db(dbName).collection(dbCollectionUnsuppLinks)
    } catch (e) {
      console.log(`Start mongo err: ${e}`)
    }
  }
  getSubsMongo () {
    try {
      return this.subsCollection.find({}).sort({advData: 1}).toArray()
    } catch (e) {
      console.log(`get Subs from mongo err: ${e}`)
    }
  }
  saveDataMongo (data, url, chatId) {
    console.log(`data length in savedata: ${data.length}`)
    try {
      this.subsCollection.updateOne({
        chatId,
        url
      }, { $push: { 'advData': {$each: data} } })
    } catch (e) {
      console.log(`saveData err:${e}`)
    }
  }
  saveUserMongo (chatId, name) {
    try {
      const newUser = {
        _id: chatId,
        name
      }
      this.userCollection.insertOne(newUser)
    } catch (e) {
      console.log(`saveUser err: ${e}`)
    }
  }
  saveSubMongo (newSubscribe) {
    try {
      console.log(`NEW SUBSCRIBE: \n${JSON.stringify(newSubscribe, null, 2)}`)
      this.subsCollection.insertOne(newSubscribe)
    } catch (e) {
      console.log(`saveSab err: ${e}`)
    }
  }
  deleteSubMongo (url, chatId) {
    try {
      this.subsCollection.deleteOne({
        'chatId': chatId,
        'url': url
      })
    } catch (e) {
      console.log(`deleteSub err: ${e}`)
    }
  }
  saveUnsuppUrl (url) {
    try {
      this.unsupplinksCollection.insertOne({ url })
    } catch (e) {
      console.log(`save unsuppUrl err: ${e}`)
    }
  }
}
