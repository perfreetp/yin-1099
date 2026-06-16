export default defineAppConfig({
  pages: [
    'pages/cycle/index',
    'pages/calendar/index',
    'pages/reminder/index',
    'pages/record/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFAFB',
    navigationBarTitleText: '好孕',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFAFB'
  },
  tabBar: {
    color: '#B0A2A8',
    selectedColor: '#D4859C',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/cycle/index',
        text: '周期'
      },
      {
        pagePath: 'pages/calendar/index',
        text: '日历'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '提醒'
      },
      {
        pagePath: 'pages/record/index',
        text: '记录'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
