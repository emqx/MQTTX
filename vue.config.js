module.exports = {
  pluginOptions: {
    electronBuilder: {
      // Prevent bundling of certain imported packages and instead retrieve these external dependencies at runtime.
      // In order to connect to websocket.
      externals: ['mqtt'],
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
