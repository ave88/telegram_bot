const mongoClient = require('mongodb').MongoClient
const config = require('../configs/config.js')

const dbUrl = config.dbUrl
const dbName = config.dbName
const dbCollectionSubs = config.dbCollectionSubs
const dbCollectionUsers = config.dbCollectionUsers

module.exports = class Mongo {
  async startMongo () {
    try {
      const client = await mongoClient.connect(dbUrl)
      this.subsCollection = client.db(dbName).collection(dbCollectionSubs)
      this.userCollection = client.db(dbName).collection(dbCollectionUsers)
    } catch (e) {
      console.log(`Start mongo err: ${e}`)
    }
  }
  getSubs () {
    try {
      return this.subsCollection.find({}).sort({advData: 1}).toArray()
    } catch (e) {
      console.log(`get Subs from mongo err: ${e}`)
    }
  }
  getUserSubs (chatId) {
    try {
      return this.subsCollection.find({chatId}).toArray()
    } catch (e) {
      console.log(`getUserSubs err: ${e}`)
    }
  }
  getSub (url, chatId) {
    try {
      return this.subsCollection.findOne({chatId, url})
    } catch (e) {
      console.log(`getSub err: ${e}`)
    }
  }
  saveData (data, url, chatId) {
    data = data.map((item) => {
      return item.link
    })
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
  saveUser (chatId, name) {
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
  saveSub (newSubscribe) {
    try {
      console.log(`NEW SUBSCRIBE: \n${JSON.stringify(newSubscribe, null, 2)}`)
      this.subsCollection.insertOne(newSubscribe)
    } catch (e) {
      console.log(`saveSab err: ${e}`)
    }
  }
  deleteSub (url, chatId) {
    try {
      this.subsCollection.deleteOne({
        'chatId': chatId,
        'url': url
      })
    } catch (e) {
      console.log(`deleteSub err: ${e}`)
    }
  }
}
