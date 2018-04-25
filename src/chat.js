const messages = require('../configs/messages.js')
const messageoptions = require('../configs/messageoptions.js')

module.exports = class Chat {
  constructor (id, bot) {
    this.id = id
    this.bot = bot
  }

  sendMessage (msg, opt) {
    console.log(`--->${this.id}---${msg}`)
    this.bot.sendMessage(this.id, msg, opt)
  }
  deleteMessage (msgId) {
    this.bot.deleteMessage(this.id, msgId)
  }
  answerCallbackQuery (queryId, msg) {
    this.bot.answerCallbackQuery(queryId, msg)
  }

  start () {
    this.sendMessage(messages.start)
  }
  menu () {
    this.sendMessage(messages.menu, messageoptions.menu)
  }

  newsubs () {
    this.sendMessage(messages.newsubs, messageoptions.newsubs)
  }
  mysubs (subscribes) {
    if (subscribes.length > 0) {
      subscribes.forEach((subscribe) => {
        this.sendMessage(messages.prettyLink(subscribe.url, subscribe.title), messageoptions.delsub)
      })
    } else {
      this.sendMessage(messages.nosubs, messageoptions.nosubs)
    }
  }
  delsub (query) {
    this.deleteMessage(query.message.message_id)
    this.answerCallbackQuery(query.id, messages.delsub)
  }

  scanUrl (url) {
    if (typeof url === 'object') {
      const message = messages.alreadySubs + messages.prettyLink(url.url, url.title)
      this.sendMessage(message, messageoptions.delsub)
    } else {
      let type
      if (url.indexOf('https://auto.ria.com/') !== -1) {
        if (url.indexOf('https://auto.ria.com/search/') !== -1) {
          type = 'ria'
        } else {
          this.sendMessage(messages.wrongUrl.ria, messageoptions.dwpp)
        }
      }
      if (url.startsWith('https://www.olx.ua/')) {
        type = 'olx'
      }
      if (url.indexOf('https://rabota.ua/') !== -1) {
        if (url.indexOf('https://rabota.ua/jobsearch/vacancy_list') !== -1) {
          type = 'rabota'
        } else {
          this.sendMessage(messages.wrongUrl.rabota, messageoptions.dwpp)
        }
      }

      if (!type) {
        this.sendMessage(messages.notSupported)
        return url
      }
      this.pendingRequest = {
        url,
        type
      }
      this.sendMessage(messages.titleQuestion + `"${messages.titleExample[type]}"`)
    }
  }
  setTitle (title) {
    let {
      url,
      type
    } = this.pendingRequest
    this.sendMessage(messages.titleAnswer)
    const newSubscribe =
    {
      chatId: this.id,
      type,
      title,
      url
    }
    return newSubscribe
  }
}
