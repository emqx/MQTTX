module.exports = {
  pluginOptions: {
    electronBuilder: {
      removeElectronJunk: true,
      builderOptions: {
        win: {
          icon: './public/app.ico'
        },
        mac: {
          icon: './public/app.png'
        },
        linux: {
          icon: './public/app.png'
        }
      }
    }
  }
}
