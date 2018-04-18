module.exports = {
  ria: {
    selectors: {
      adverts: 'section.ticket-item',
      link: '.content-bar .m-link-ticket',
      title: '.content-bar .head-ticket .ticket-title > a > span'
    },
    atributes: {
      matching: 'page=',
      secondPage: '&page=1'
    },
    pageSetting: {
      advCount: 100,
      pageCount: 'page=21',
      startAttr: '&top=1&size=100'
    }
  },
  olx: {
    selectors: {
      adverts: '.rel.listHandler > table > tbody > tr.wrap > td.offer > table',
      link: '.marginright5.link.linkWithHash.detailsLink',
      title: 'h3.x-large.lheight20.margintop5 > a > strong'
    },
    atributes: {
      matching: 'page=',
      secondPage: '&page=2'
    },
    pageSetting: {
      advCount: 44,
      pageCount: 'page=21',
      startAttr: '&view=list'
    }
  },
  rabota: {
    selectors: {
      adverts: '#content_vacancyList_gridList > tbody > tr[id]',
      link: 'h3 > a',
      title: 'h3 > a'
    },
    atributes: {
      matching: 'pg=',
      secondPage: '&pg=2'
    },
    pageSetting: {
      advCount: 2,
      pageCount: 'pg=21',
      startAttr: (() => {
        const date = new Date()
        return `&lastdate=${('0' + (date.getDate() - 1)).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`
      })()
    }
  }
}
