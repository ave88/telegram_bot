// require modules
const Chat = require('./src/chat')
const Process = require('./src/process')
const TelegramBot = require('node-telegram-bot-api')
const mongoClient = require('mongodb').MongoClient
const config = require('./configs/config')

const token = config.token
const dbUrl = config.dbUrl
const dbName = config.dbName
const dbCollectionName = config.dbCollectionName

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {
  polling: true
})

let chats = {}
const getChat = id => {
  if (chats[id]) {
    return chats[id]
  }
  chats[id] = new Chat(id, bot)
  return chats[id]
}

let processes = {}
const saveProcess = process => {
  const id = process.chatId + '_' + process.url
  processes[id] = process
}
const getId = (chatId, url) => {
  return chatId + '_' + url
}

const autoStart = async () => {
  const client = await mongoClient.connect(dbUrl)
  const collection = client.db(dbName).collection(dbCollectionName)
  await collection.find({}).toArray((err, results) => {
    if (err) { console.log(err) }
    results.forEach((item) => {
      const process = new Process(item.url, item.chatId, item.title, item.type, bot)
      saveProcess(process)
      process.start(false)
    })
  })
}
autoStart()

bot.on('text', msg => {
  console.log(`Message log: \n${JSON.stringify(msg, null, 2)}`,
    `================`)
  const chat = getChat(msg.chat.id)
  if (msg.text === '/start') {
    chat.start()
  } else if (msg.text === '/menu') {
    chat.menu()
  } else if (msg.text.startsWith('http')) {
    chat.scanUrl(msg.text)
  } else if (chat.pendingRequest) {
    let process = chat.setTitle(msg.text)
    saveProcess(process)
  }
})
bot.on('callback_query', query => {
  console.log(`Query log: \n${JSON.stringify(query, null, 2)}`,
    `================`)
  const chat = getChat(query.message.chat.id)
  if (query.data === 'newsubs') {
    chat.newsubs()
  } else if (query.data === 'mysubs') {
    chat.mysubs(processes)
  } else if (query.data === 'delsub') {
    const url = query.message.entities[0].url
    const chatId = query.message.chat.id
    const id = getId(chatId, url)
    processes[id].stop()
    delete processes[id]
    chat.delsub(query)
  }
})
