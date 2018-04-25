const Mongo = require('./mongo.js')
const puppeteer = require('puppeteer')
const Site = require('./site.js')
const messages = require('../configs/messages.js')
const delay = require('delay')

module.exports = class Process extends Mongo {
  constructor (bot) {
    super()
    this.bot = bot
    this.messages = []
  }
  async startPuppeteer () {
    const browser = await puppeteer.launch({
      headless: true
    })
    const page = await browser.newPage()
    // await page.setJavaScriptEnabled(false)
    this.page = page
  }
  async startServices () {
    await this.startPuppeteer()
    await this.startMongo()
    this.subscribes = await this.getSubsMongo()
  }
  getUserSubs (chatId) {
    let userSubs = []
    this.subscribes.forEach(subscribe => {
      if (subscribe['chatId'] === chatId) {
        userSubs.push(subscribe)
      }
    })
    return userSubs
  }
  getSub (url, chatId) {
    let userSub
    this.subscribes.forEach(subscribe => {
      if (subscribe.url === url && subscribe.chatId === chatId) {
        userSub = subscribe
      }
    })
    return userSub
  }
  saveData (data, url, chatId) {
    data = data.map((item) => {
      return item.link
    })
    this.subscribes.forEach(subscribe => {
      if (subscribe.url === url && subscribe.chatId === chatId) {
        (subscribe.advData) ? subscribe.advData.push(...data) : subscribe.advData = data
      }
    })
    this.saveDataMongo(data, url, chatId)
  }
  saveSub (newSubscribe) {
    this.subscribes.push(newSubscribe)
    this.saveSubMongo(newSubscribe)
  }
  deleteSub (url, chatId) {
    this.subscribes.forEach((subscribe, i) => {
      if (subscribe.url === url && subscribe.chatId === chatId) {
        delete this.subscribes[i]
      }
    })
    this.deleteSubMongo(url, chatId)
  }

  async messageSender () {
    while (true) {
      console.log('m:' + this.messages.length)
      if (this.messages.length > 0) {
        let subs = new Set()
        this.subscribes.forEach((subscribe) => {
          subs.add(subscribe.chatId + '_' + subscribe.url)
        })
        const sendMessages = this.messages.splice(0, 25)
        sendMessages.forEach((msg) => {
          if (subs.has(msg.chatId + '_' + msg.url) || msg.message) {
            let message = msg.message || messages.prettyLink(msg.link, msg.title)
            this.bot.sendMessage(msg.chatId, message, {parse_mode: 'HTML'})
          }
        })
        await delay(2000)
      } else {
        await delay(5000)
      }
    }
  }
  async start () {
    while (true) {
      if (this.subscribes.length === 0) {
        await delay(10000)
      }
      for (let subscribe of this.subscribes) {
        let {
          url,
          title,
          type,
          advData,
          chatId
        } = subscribe
        const site = new Site(url, type, this.page, advData, chatId)
        let subMessages = await site.getNewMessages()
        console.log('sub msg length:' + subMessages.length)
        if (subMessages.length > 30) {
          subMessages = [{chatId, message: messages.manyResults(url, title)}]
          this.deleteSub(url, chatId)
        }
        if (subMessages.length > 0 || advData === undefined) {
          this.saveData(site.data, url, chatId)
        }
        this.messages.push(...subMessages)
      }
      await delay(20000)
    }
  }
}
