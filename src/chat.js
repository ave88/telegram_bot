const messages = require('../configs/messages')
const Process = require('./process')
const messageoptions = require('../configs/messageoptions')

module.exports = class Chat {
  constructor (id, bot) {
    this.id = id
    this.bot = bot
  }

  sendMessage (msg, opt) {
    console.log(msg)
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
  mysubs (processes) {
    let noSubs = true
    for (let key in processes) {
      if (key.startsWith(this.id)) {
        const message = `<a href="${processes[key].url}">${processes[key].title}</a>`
        this.sendMessage(message, messageoptions.delsub)
        noSubs = false
      }
    }
    if (noSubs) {
      this.sendMessage(messages.nosubs, messageoptions.menu)
    }
  }
  delsub (query) {
    this.deleteMessage(query.message.message_id)
    this.answerCallbackQuery(query.id, messages.delsub)
  }

  scanUrl (url) {
    let type
    if (url.indexOf('https://auto.ria.com/') !== -1) {
      if (url.indexOf('https://auto.ria.com/search/') !== -1) {
        type = 'ria'
      } else {
        this.sendMessage(messages.wrongUrlRia, {
          disable_web_page_preview: true
        })
      }
    }
    if (url.startsWith('https://www.olx.ua/')) {
      type = 'olx'
    }
    if (url.indexOf('https://rabota.ua/') !== -1) {
      if (url.indexOf('https://rabota.ua/jobsearch/vacancy_list') !== -1) {
        type = 'rabota'
      } else {
        this.sendMessage(messages.wrongUrlRabota, {
          disable_web_page_preview: true
        })
      }
    }

    if (!type) {
      throw new Error('wrong url')
    }
    this.pendingRequest = {
      url,
      type
    }
    this.sendMessage(messages.titleQuestion + `"${this.getExample(type)}"`)
  }
  setTitle (title) {
    let {
      url,
      type
    } = this.pendingRequest
    this.sendMessage(messages.titleAnswer)
    const process = new Process(url, this.id, title, type, this.bot)
    process.saveToMongo()
    process.start()
    return process
  }

  getExample (type) {
    switch (type) {
      case 'ria':
        return messages.titleExampleRia
      case 'olx':
        return messages.titleExampleOlx
      case 'rabota':
        return messages.titleExampleRabota
    }
  }
}
