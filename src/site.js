const siteConfig = require('../configs/siteconfig')

module.exports = class Site {
  constructor (type) {
    this.advSelector = siteConfig[type].selectors.adverts
    this.linkSelector = siteConfig[type].selectors.link
    this.idSelector = siteConfig[type].selectors.id
    this.titleSelector = siteConfig[type].selectors.title
    this.matchAttr = siteConfig[type].atributes.matching
    this.secondPageAttr = siteConfig[type].atributes.secondPage
    this.advCount = siteConfig[type].pageSetting.advCount
    this.pageCount = siteConfig[type].pageSetting.pageCount
    this.startAttr = siteConfig[type].pageSetting.startAttr
  }
  fixUrl (url) {
    console.log(`starturl: ${url}`)
    const linkArr = url.split('&')
    const filteredArr = linkArr.filter((item, i, arr) => {
      return (item.indexOf('size=') < 0 &&
              item.indexOf('page=') < 0 &&
              item.indexOf('top=') < 0 &&
              item.indexOf('sort') < 0 &&
              item.indexOf('search%5Border%5D=') < 0 &&
              item.indexOf('view=') < 0 &&
              item.indexOf('pg=') < 0 &&
              item.indexOf('lastdate=') < 0)
    })
    const link = filteredArr.join('&') + this.startAttr
    return link
  }
  getNextPage (url) {
    console.log(`starturl: ${url}`)
    if (url.indexOf(this.matchAttr) === -1) {
      return url + this.secondPageAttr
    } else {
      let arr = url.split('&')
      let attArr = arr.splice(arr.indexOf(this.matchAttr), 1)
      let link = arr.join('&')
      attArr = attArr[0].split('=')
      attArr[1] = +attArr[1] + 1
      link += '&' + attArr.join('=')
      return link
    }
  }
  async getPageData (page) {
    const parsedData = await page.evaluate((advSelector, linkSelector, idSelector, titleSelector) => {
      const adverts = document.querySelectorAll(advSelector)
      let arr = []
      adverts.forEach((item, i) => {
        const link = item.querySelector(linkSelector).href
        const title = item.querySelector(titleSelector).textContent
        arr[i] = [link, title]
      })
      return arr
    }, this.advSelector, this.linkSelector, this.idSelector, this.titleSelector)
    return parsedData
  }
}
