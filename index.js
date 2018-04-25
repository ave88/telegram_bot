// require modules
const Chat = require('./src/chat.js')
const Process = require('./src/process.js')
const TelegramBot = require('node-telegram-bot-api')
const config = require('./configs/config.js')

const token = config.token

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {
  polling: true
})
const process = new Process(bot)

const start = async () => {
  await process.startServices()
  process.start()
  process.messageSender()
}

let chats = {}
const getChat = id => {
  if (chats[id]) {
    return chats[id]
  }
  chats[id] = new Chat(id, bot)
  return chats[id]
}

bot.on('text', msg => {
  console.log(`Message:\n<---${msg.chat.id}---${msg.text}`)
  const chat = getChat(msg.chat.id)
  if (msg.text === '/start') {
    chat.start()
    process.saveUserMongo(msg.chat.id, msg.from.first_name)
  } else if (msg.text === '/menu') {
    chat.menu()
  } else if (msg.text.startsWith('http')) {
    const userSub = process.getSub(msg.text, msg.chat.id)
    const arg = userSub || msg.text
    const unsuppUrl = chat.scanUrl(arg)
    if (unsuppUrl) process.saveUnsuppUrl(unsuppUrl)
  } else if (chat.pendingRequest) {
    const newSubscribe = chat.setTitle(msg.text)
    process.saveSub(newSubscribe)
    chat.pendingRequest = ''
  }
})
bot.on('callback_query', query => {
  console.log(`Query:\n<---${query.message.chat.id}---${query.data}`)
  const chat = getChat(query.message.chat.id)
  if (query.data === 'newsubs') {
    chat.newsubs()
  } else if (query.data === 'mysubs') {
    const subscribes = process.getUserSubs(query.message.chat.id)
    chat.mysubs(subscribes)
  } else if (query.data === 'delsub') {
    const url = query.message.entities[0].url
    const chatId = query.message.chat.id
    process.deleteSub(url, chatId)
    chat.delsub(query)
  }
})
start()
