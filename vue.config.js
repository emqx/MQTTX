module.exports = {
  pluginOptions: {
    electronBuilder: {
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
