module.exports = {
  newsubs: {
    reply_markup: {
      inline_keyboard: [
        [{
          url: 'https://auto.ria.com/advanced-search/',
          text: 'Auto.ria.com'
        }],
        [{
          url: 'https://www.olx.ua/',
          text: 'Olx.ua'
        }],
        [{
          url: 'https://rabota.ua/jobsearch/vacancy_list',
          text: 'Rabota.ua'
        }]
      ]
    },
    disable_web_page_preview: true
  },
  menu: {
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'Новая подписка',
          callback_data: 'newsubs'
        }, {
          text: 'Мои подписки',
          callback_data: 'mysubs'
        }]
      ]
    }
  },
  delsub: {
    reply_markup: {
      inline_keyboard: [
        [{
          text: '⬆️ Удалить',
          callback_data: `delsub`
        }]
      ]
    },
    disable_web_page_preview: true,
    parse_mode: 'HTML',
    disable_notification: true
  },
  dwpp: {
    disable_web_page_preview: true
  },
  nosubs: {
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'Новая подписка',
          callback_data: 'newsubs'
        }]
      ]
    }
  }
}
