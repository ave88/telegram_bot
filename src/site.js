const siteConfig = require('../configs/siteconfig.js')
const URL = require('url')

module.exports = class Site {
  constructor (url, type, page, dbData, chatId) {
    this.selectors = siteConfig[type].selectors
    this.attributes = siteConfig[type].attributes
    this.currentPage = siteConfig[type].attributes.startPage
    this.removableAttrs = siteConfig.removableAttrs
    this.maxAdvCount = (dbData) ? siteConfig.maxAdvCount : siteConfig.maxAdvCount + 100
    this.url = url
    this.page = page
    this.dbData = dbData
    this.chatId = chatId
  }

  fixUrl (url) {
    const parsedUrl = URL.parse(url, true)
    delete parsedUrl.search
    this.removableAttrs.forEach((attr) => {
      delete parsedUrl.query[attr]
    })
    Object.assign(parsedUrl.query, this.attributes.startAttr)
    console.log(`fixUrl\n<---:${url} \n--->:${URL.format(parsedUrl)}`)
    return URL.format(parsedUrl)
  }
  getNextPage (url) {
    const parsedUrl = URL.parse(url, true)
    delete parsedUrl.search
    this.currentPage += 1
    parsedUrl.query[this.attributes.pageAttr] = this.currentPage
    console.log(`getNextPage\n<---:${url} \n--->:${URL.format(parsedUrl)}`)
    return URL.format(parsedUrl)
  }
  fixUrlHash (url) {
    const parsedUrl = URL.parse(url, true)
    delete parsedUrl.hash
    return URL.format(parsedUrl)
  }

  async getNewMessages () {
    await this.page.goto(this.fixUrl(this.url))
    this.data = []
    while (true) {
      let pageData = await this.getPageData()
      pageData.forEach(dataElement => {
        dataElement.link = this.fixUrlHash(dataElement.link)
      })
      const nextPageUrl = this.getNextPage(this.page.url())
      this.data = this.data.concat(pageData)
      if (pageData.length === 0 || this.data.length > this.maxAdvCount) {
        break
      }
      await this.page.goto(nextPageUrl)
    }
    return this.dataHandling()
  }
  getPageData () {
    return this.page.evaluate((advSelector, linkSelector, titleSelector) => {
      const adverts = document.querySelectorAll(advSelector)
      let arr = []
      adverts.forEach((advert, i) => {
        const link = advert.querySelector(linkSelector).href
        const title = advert.querySelector(titleSelector).innerHTML
        arr[i] = {link, title}
      })
      return arr
    }, this.selectors.adverts, this.selectors.link, this.selectors.title)
  }
  dataHandling () {
    let message = []
    if (this.dbData) {
      let dbData = new Set(this.dbData)
      this.data = this.data.map((item) => {
        if (!dbData.has(item.link)) {
          message.push({
            chatId: this.chatId,
            link: item.link,
            title: item.title.replace(/\n\t/g, ''),
            url: this.url
          })
          return item
        }
      })
    }
    return message
  }
}
