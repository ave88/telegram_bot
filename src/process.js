const Site = require('./site')
const puppeteer = require('puppeteer')
const mongoClient = require('mongodb').MongoClient
const config = require('../configs/config')

const dbUrl = config.dbUrl
const dbName = config.dbName
const dbCollectionName = config.dbCollectionName

module.exports = class Process {
  constructor (url, chatId, title, type, bot) {
    this.type = type
    this.site = new Site(this.type)
    this.url = this.site.fixUrl(url)
    this.chatId = chatId
    this.title = title
    this.bot = bot
  }

  async getData () {
    console.log(`URL in start getData: \n${this.url} \n================`)
    const browser = await puppeteer.launch({
      headless: true
    })
    const page = await browser.newPage()
    await page.setJavaScriptEnabled(false)
    await page.goto(this.url)
    const parsedData = await this.pageHandling(page, [])
    await browser.close()
    return parsedData
  }
  async pageHandling (page, parsedData) {
    const nextPageUrl = this.site.getNextPage(page.url())
    const parsedTempData = await this.site.getPageData(page)
    parsedData = parsedData.concat(parsedTempData)
    if (parsedTempData.length === this.site.advCount || parsedTempData.length > 0) {
      if (nextPageUrl.indexOf(this.site.pageCount) === -1) {
        console.log('not empty page = ' + parsedTempData.length + ' \n================')
        await page.goto(nextPageUrl)
        parsedData = await this.pageHandling(page, parsedData)
      }
    }
    return parsedData
  }
  async dataHandling (data) {
    // console.log(JSON.stringify(data, null, 2) + '\n================')
    const dbData = await this.getDataFromMongo()
    let message = ''
    data = data.filter((item) => {
      if (dbData.indexOf(item[0]) === -1) {
        message += `<a href="${item[0]}">${item[1].replace(/\n/g, '')}</a> \n`
        return true
      }
    })
    if (message.length !== 0) {
      console.log(message.length)
      this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    }
    await this.saveDataToMongo(data)
  }

  async saveDataToMongo (data) {
    data = data.map((item) => {
      return item[0]
    })
    console.log(`data length in savedatatomongo: ${data.length}`)
    await mongoClient.connect(dbUrl, (err, client) => {
      const collection = client.db(dbName).collection(dbCollectionName)
      collection.updateOne({
        'chatId': this.chatId,
        'url': this.url
      }, {
        $push: {
          'advData': {
            $each: data
          }
        }
      })
      if (err) {
        return console.log(`mongo connection error: \n ${err}`)
      }
      client.close()
    })
  }
  async getDataFromMongo () {
    let dbData
    const client = await mongoClient.connect(dbUrl)
    const collection = client.db(dbName).collection(dbCollectionName)
    dbData = await collection.findOne({
      'chatId': this.chatId,
      'url': this.url
    }, {
      'advData': 1,
      '_id': 0
    })
    await client.close()
    return dbData.advData
  }
  async saveToMongo () {
    const newSubscribe = {
      chatId: this.chatId,
      title: this.title,
      type: this.type,
      url: this.url,
      advData: []
    }
    console.log(`NEW SUBSCRIBE: \n${JSON.stringify(newSubscribe, null, 2)} \n================`)
    await mongoClient.connect(dbUrl, (err, client) => {
      const collection = client.db(dbName).collection(dbCollectionName)
      collection.insertOne(newSubscribe, (err, result) => {
        if (err) {
          console.log(err)
        } else {
          console.log(`${JSON.stringify(result.ops, null, 2)} \n================`)
        }
      })
      if (err) {
        return console.log(`mongo connection error: \n ${err}`)
      }
      client.close()
    })
  }
  async deleteSubsFromMongo () {
    const client = await mongoClient.connect(dbUrl)
    const collection = client.db(dbName).collection(dbCollectionName)
    await collection.deleteOne({
      'chatId': this.chatId,
      'url': this.url
    })
  }

  async start (first = true) {
    if (first) {
      const data = await this.getData()
      console.log(`data length: ${data.length}`)
      await this.saveDataToMongo(data)
    }
    this.timerId = setInterval(async () => {
      const data = await this.getData()
      console.log(`data length: ${data.length}`)
      this.dataHandling(data)
    }, 300000)
  }
  async stop () {
    await this.deleteSubsFromMongo()
    clearTimeout(this.timerId)
  }
}
