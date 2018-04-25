const Mongo = require('./mongo.js')
const puppeteer = require('puppeteer')
const Site = require('./site.js')
const messages = require('../configs/messages.js')

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
    await page.setJavaScriptEnabled(false)
    this.page = page
  }
  async startServices () {
    await this.startPuppeteer()
    await this.startMongo()
    this.subscribes = await this.getSubs()
  }
  wait (time) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, time)
    })
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
        await this.wait(2000)
      } else {
        await this.wait(5000)
      }
    }
  }

  async start () {
    while (true) {
      if (this.subscribes.length === 0) {
        await this.wait(10000)
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
          await this.deleteSub(url, chatId)
        }
        if (subMessages.length > 0 || advData === undefined) {
          await this.saveData(site.data, url, chatId)
        }
        this.messages.push(...subMessages)
      }
      await this.wait(10000)
    }
  }
}
